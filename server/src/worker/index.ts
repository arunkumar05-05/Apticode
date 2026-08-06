/**
 * Phase 5 — worker entrypoint.
 *
 * Boots DB + Redis, constructs the three-stage queue pipeline, registers
 * BullMQ workers (concurrency from config), routes terminal failures to
 * DLQs + SYSTEM_ERROR, publishes heartbeats, and shuts down gracefully on
 * SIGTERM/SIGINT with a 30s watchdog.
 *
 * Runnable via `npm run worker` (ts-node src/worker/index.ts). Exports
 * nothing that app.ts needs.
 */
import 'dotenv/config';
import { Worker } from 'bullmq';
import { config, logger } from '../config';
import { db, initDatabase } from '../prisma/db';
import { createRedisConnection } from '../config/redis';
import { createQueues } from '../queues/factory';
import { JOB_NAMES, QUEUE_NAMES } from '../queues/constants';
import { createJudge0Provider } from '../integrations/judge0/provider';
import { publishSubmissionEvent } from '../events/submissionEvents';
import type { SubmissionEvent } from '../events/submissionEvents';
import { startHeartbeat } from './heartbeat';
import { processSubmissionJob } from './processSubmission';
import { processEvaluationJob } from './processEvaluation';
import { applyResultJob } from './processResult';
import {
  DlqJobPayload,
  EvaluationJobPayload,
  ResultJobPayload,
  SubmissionJobPayload,
  TERMINAL_STATUSES,
  WorkerDeps,
} from './types';

async function main(): Promise<void> {
  await initDatabase();

  const connection = createRedisConnection();
  const queues = createQueues(connection);
  const judge0Provider = createJudge0Provider();
  const deps: WorkerDeps = {
    db,
    logger,
    config,
    judge0Provider,
    queues,
    publish: (evt: SubmissionEvent) => void publishSubmissionEvent(evt),
  };
  const heartbeat = startHeartbeat(connection, { judge0Name: judge0Provider.name });

  const workerOptions = {
    connection,
    prefix: config.queue.prefix,
    concurrency: config.judge0.concurrency,
  };

  const submissionWorker = new Worker(
    QUEUE_NAMES.submission,
    async (job) => {
      heartbeat.setCurrentJobId(job.id ?? undefined);
      try {
        await processSubmissionJob(job.data as SubmissionJobPayload, deps);
        heartbeat.tickProcessed();
      } finally {
        heartbeat.setCurrentJobId(undefined);
      }
    },
    workerOptions
  );

  const evaluationWorker = new Worker(
    QUEUE_NAMES.evaluation,
    async (job) => {
      heartbeat.setCurrentJobId(job.id ?? undefined);
      try {
        await processEvaluationJob(job.data as EvaluationJobPayload, deps);
        heartbeat.tickProcessed();
      } finally {
        heartbeat.setCurrentJobId(undefined);
      }
    },
    workerOptions
  );

  const resultWorker = new Worker(
    QUEUE_NAMES.result,
    async (job) => {
      heartbeat.setCurrentJobId(job.id ?? undefined);
      try {
        await applyResultJob(job.data as ResultJobPayload, deps);
        heartbeat.tickProcessed();
      } finally {
        heartbeat.setCurrentJobId(undefined);
      }
    },
    workerOptions
  );

  submissionWorker.on('failed', (job, err) => {
    heartbeat.tickFailed();
    void handleFailed(job, QUEUE_NAMES.submission, err, deps);
  });
  evaluationWorker.on('failed', (job, err) => {
    heartbeat.tickFailed();
    void handleFailed(job, QUEUE_NAMES.evaluation, err, deps);
  });
  resultWorker.on('failed', (job, err) => {
    heartbeat.tickFailed();
    void handleFailed(job, QUEUE_NAMES.result, err, deps);
  });

  logger.info(
    { judge0: judge0Provider.name, redis: config.redis.url || '(default localhost)' },
    'Code worker started'
  );

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down code worker');
    heartbeat.stop();
    await Promise.allSettled([
      submissionWorker.close(),
      evaluationWorker.close(),
      resultWorker.close(),
      queues.submissionDlq.close(),
      queues.evaluationDlq.close(),
      queues.resultDlq.close(),
    ]);
    await connection.quit().catch(() => {});
    await db.$disconnect().catch(() => {});
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  const watchdog = setTimeout(() => {
    logger.error('Shutdown watchdog fired — forcing exit');
    process.exit(1);
  }, 30_000);
  watchdog.unref();
}

async function handleFailed(job: any, queueName: string, err: Error, deps: WorkerDeps): Promise<void> {
  const message = String(err?.message || err).slice(0, 500);
  logger.error({ queueName, jobId: job?.id, message }, 'Job failed after retries — routing to DLQ');
  const data: any = job?.data || {};
  const dlqPayload: DlqJobPayload = {
    submissionId: data.submissionId,
    userId: data.userId,
    problemId: data.problemId,
    originalQueue: queueName,
    originalJobId: job?.id,
    errorMessage: message,
  };

  if (!job?.id || queueName === QUEUE_NAMES.result) return;

  const dlq = queueName === QUEUE_NAMES.submission ? deps.queues?.submissionDlq : deps.queues?.evaluationDlq;
  await dlq
    ?.add(JOB_NAMES.dlq, dlqPayload, { jobId: `dlq-${job.id}` })
    .catch((e: any) => logger.error({ err: e?.message }, 'DLQ add failed'));

  await deps.db.codingSubmission
    .updateMany({
      where: { id: data.submissionId, status: { notIn: [...TERMINAL_STATUSES] } },
      data: { status: 'SYSTEM_ERROR', errorMessage: message, completedAt: new Date() },
    })
    .catch((e: any) => logger.warn({ err: e?.message }, 'SYSTEM_ERROR persist failed'));

  const attempts = Number(job?.opts?.attempts ?? 1);
  if (Number(job?.attemptsMade ?? 0) >= attempts && data.submissionId && data.userId) {
    deps.publish?.({
      type: 'SUBMISSION_UPDATED',
      submissionId: data.submissionId,
      userId: data.userId,
      status: 'SYSTEM_ERROR',
      stage: 'error',
      message,
      createdAt: new Date().toISOString(),
    });
  }
}

main().catch((err: any) => {
  logger.error({ err: err?.message }, 'Worker failed to start');
  process.exit(1);
});
