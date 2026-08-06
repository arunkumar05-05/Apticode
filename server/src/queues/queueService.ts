/**
 * Phase 5 — queue service (API side).
 *
 * enqueueSubmission dedupes on submissionId (BullMQ jobId), so a retried
 * HTTP request never double-schedules. When Redis is unreachable (5s-cached
 * ping), submissions run inline through the same pure processors — dev and
 * tests get synchronous terminal results with no Redis dependency.
 * getQueueMetrics / requeueFailedJobs never throw: admin monitoring stays
 * degraded-200 when Redis is down.
 */
import { config, logger } from '../config';
import { db } from '../prisma/db';
import { redisPing } from '../config/redis';
import { createQueues, QueueSet } from './factory';
import { JOB_NAMES, QUEUE_NAMES } from './constants';
import { createJudge0Provider } from '../integrations/judge0/provider';
import { processSubmissionJob } from '../worker/processSubmission';
import { SubmissionJobPayload, WorkerDeps } from '../worker/types';

const PING_TTL_MS = 5_000;

let queueSet: QueueSet | null = null;
function getQueues(): QueueSet {
  queueSet ??= createQueues();
  return queueSet;
}

let pingCache: { ok: boolean; at: number } | null = null;

export async function redisReachable(): Promise<boolean> {
  if (pingCache && Date.now() - pingCache.at < PING_TTL_MS) return pingCache.ok;
  const ok = await redisPing();
  pingCache = { ok, at: Date.now() };
  return ok;
}

export type EnqueueSubmissionResult = { mode: 'queued' } | { mode: 'inline'; status: string };

export async function enqueueSubmission(
  payload: SubmissionJobPayload
): Promise<EnqueueSubmissionResult> {
  if (await redisReachable()) {
    await getQueues().submission.add(JOB_NAMES.submission, payload, {
      jobId: payload.submissionId,
    });
    return { mode: 'queued' };
  }

  logger.warn({ submissionId: payload.submissionId }, 'Redis unreachable — running code submission inline');
  const deps: WorkerDeps = { db, logger, config, judge0Provider: createJudge0Provider() };
  const outcome = await processSubmissionJob(payload, deps);
  return { mode: 'inline', status: outcome.status };
}

export interface QueueMetricsEntry {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  avgCompletedMs?: number;
  maxCompletedMs?: number;
}

export interface QueueMetrics {
  redisReachable: boolean;
  queues: QueueMetricsEntry[];
}

const QUEUE_ROWS: Array<{ name: string; pick: (q: QueueSet) => any }> = [
  { name: QUEUE_NAMES.submission, pick: (q) => q.submission },
  { name: QUEUE_NAMES.evaluation, pick: (q) => q.evaluation },
  { name: QUEUE_NAMES.result, pick: (q) => q.result },
  { name: QUEUE_NAMES.submissionDlq, pick: (q) => q.submissionDlq },
  { name: QUEUE_NAMES.evaluationDlq, pick: (q) => q.evaluationDlq },
  { name: QUEUE_NAMES.resultDlq, pick: (q) => q.resultDlq },
];

export async function getQueueMetrics(): Promise<QueueMetrics> {
  const queues = getQueues();
  const empty = (name: string): QueueMetricsEntry => ({
    name,
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    paused: 0,
  });

  try {
    const entries = await Promise.all(
      QUEUE_ROWS.map(async ({ name, pick }) => {
        const [counts, completed] = await Promise.all([
          pick(queues).getJobCounts(),
          pick(queues).getMetrics('completed'),
        ]);
        return {
          ...empty(name),
          ...counts,
          avgCompletedMs: completed?.mean != null ? Math.round(completed.mean) : undefined,
          maxCompletedMs: completed?.max != null ? Math.round(completed.max) : undefined,
        };
      })
    );
    return { redisReachable: true, queues: entries };
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Queue metrics unavailable (Redis down)');
    return { redisReachable: false, queues: QUEUE_ROWS.map(({ name }) => empty(name)) };
  }
}

export async function requeueFailedJobs(queueName: string): Promise<{ requeued: number }> {
  const queues = getQueues();
  const row = QUEUE_ROWS.find((r) => r.name === queueName);
  if (!row) throw new Error(`Unknown queue: ${queueName}`);
  const failed = await row.pick(queues).getFailed();
  let requeued = 0;
  for (const job of failed) {
    try {
      await job.retry();
      requeued += 1;
    } catch (err: any) {
      logger.warn({ jobId: job.id, err: err?.message }, 'Failed to requeue job');
    }
  }
  return { requeued };
}
