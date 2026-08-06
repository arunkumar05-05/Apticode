/**
 * Phase 5 — Redis integration tests (real BullMQ against a real Redis).
 *
 * OPT-IN: set RUN_REDIS_TESTS=true and have Redis reachable at REDIS_URL
 * (default redis://127.0.0.1:6379 — `docker compose up -d redis`).
 *
 *   RUN_REDIS_TESTS=true npm test -- coding.redis.integration
 *
 * The suite is skipped when the gate is unset so `npm test` stays green in
 * environments without Redis. When the gate IS set but Redis is unreachable,
 * beforeAll fails loudly with a clear message.
 *
 * Verifies the real queue layer end-to-end:
 *   - submission → evaluation → result pipeline through live BullMQ workers
 *     (in-memory db, fake Judge0 provider — the queue round-trip is the
 *     subject under test)
 *   - jobId dedup: a retried enqueue never double-schedules / double-runs
 *   - DLQ persistence on the submission-failure path
 *   - requeueFailedJobs (admin retry)
 *   - getQueueMetrics (admin monitoring)
 *   - worker heartbeats (write + read + health)
 */
// Heartbeat env vars must be set before the first config getter fires.
// config getters are lazy (loadConfig caches on first access) and no module
// in the import chain reads config at import time, so this is safe here.
process.env.WORKER_HEARTBEAT_INTERVAL_MS = '50';
process.env.WORKER_HEARTBEAT_TTL_MS = '5000';

import Redis from 'ioredis';
import { Worker } from 'bullmq';

import { config, logger } from '../src/config';
import { db } from '../src/prisma/db';
import { createRedisConnection, redisPing } from '../src/config/redis';
import { createQueues, QueueSet } from '../src/queues/factory';
import { JOB_NAMES, QUEUE_NAMES } from '../src/queues/constants';
import {
  enqueueSubmission,
  getQueueMetrics,
  requeueFailedJobs,
} from '../src/queues/queueService';
import { processSubmissionJob } from '../src/worker/processSubmission';
import { processEvaluationJob } from '../src/worker/processEvaluation';
import { applyResultJob } from '../src/worker/processResult';
import {
  heartbeatKey,
  isWorkerHealthy,
  readHeartbeats,
  startHeartbeat,
} from '../src/worker/heartbeat';
import { SubmissionJobPayload, WorkerDeps } from '../src/worker/types';
import { Judge0CaseOutcome, Judge0Provider } from '../src/integrations/judge0/types';

const RUN = process.env.RUN_REDIS_TESTS === 'true';
const describeFn = RUN ? describe : describe.skip;

function makeFakeProvider(outcomes: () => Judge0CaseOutcome[]): Judge0Provider {
  return {
    name: 'fake',
    async submitBatch(reqs) {
      const o = outcomes();
      return reqs.map((_, i) => o[i] ?? { token: `t${i}`, statusId: 3, verdict: 'ACCEPTED' });
    },
    async resolveLanguageId() {
      return 71;
    },
    async getLanguages() {
      return [];
    },
  };
}

async function waitFor(
  fn: () => Promise<boolean> | boolean,
  timeoutMs = 20_000,
  stepMs = 100
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}

describeFn('Phase 5 — Redis integration (real BullMQ)', () => {
  let connection: Redis;
  let queues: QueueSet;
  const workers: Worker[] = [];

  beforeAll(async () => {
    if (!(await redisPing(2000))) {
      throw new Error(
        `RUN_REDIS_TESTS=true but Redis is unreachable at ${config.redis.url || 'redis://127.0.0.1:6379'}.\n` +
          'Start it with: docker compose up -d redis'
      );
    }
    connection = createRedisConnection();
    // Flush between runs: BullMQ dedups Queue.add() by jobId, so jobs left
    // behind by a previously crashed run (jest forceExit kills workers
    // mid-processing) would make re-runs silently no-op.
    await connection.flushdb();
    queues = createQueues(connection);

    const provider = makeFakeProvider(() => [
      { token: 'a', statusId: 3, verdict: 'ACCEPTED', stdout: '42', timeSec: 0.01, memoryKb: 1024 },
      { token: 'b', statusId: 3, verdict: 'ACCEPTED', stdout: '8', timeSec: 0.01, memoryKb: 1024 },
    ]);
    const deps: WorkerDeps = { db, logger, config, judge0Provider: provider, queues };

    const opts = { connection, prefix: config.queue.prefix, concurrency: 2 };
    const wrap =
      (fn: (payload: any, deps: WorkerDeps) => Promise<any>) =>
      async (job: any) => {
        await fn(job.data, deps);
      };
    workers.push(
      new Worker(QUEUE_NAMES.submission, wrap(processSubmissionJob), opts),
      new Worker(QUEUE_NAMES.evaluation, wrap(processEvaluationJob), opts),
      new Worker(QUEUE_NAMES.result, wrap(applyResultJob), opts)
    );
  });

  afterAll(async () => {
    await Promise.allSettled(workers.map((w) => w.close()));
    await Promise.allSettled(
      Object.values(queues).map((q) => q.close())
    );
    await connection?.quit().catch(() => {});
  });

  it('runs the full submission → evaluation → result pipeline and awards XP once', async () => {
    const userId = 'redis-u1';
    const problemId = 'redis-p1';
    const submissionId = 'redis-s1';
    await db.user.create({ data: { id: userId, email: 'redis-u1@test.dev', passwordHash: 'x', xp: 0 } });
    await db.codingProblem.create({
      data: {
        id: problemId,
        title: 'Redis Sum',
        description: 'Add one.',
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
        testcases: {
          create: [
            { id: 'redis-tc1', inputData: '41', expectedOutput: '42', isHidden: false },
            { id: 'redis-tc2', inputData: '7', expectedOutput: '8', isHidden: true },
          ],
        },
      },
    });
    await db.codingSubmission.create({
      data: {
        id: submissionId,
        userId,
        problemId,
        code: 'print(int(input()) + 1)',
        language: 'python',
        status: 'QUEUED',
      },
    });

    const result = await enqueueSubmission({
      submissionId,
      userId,
      problemId,
      code: 'print(int(input()) + 1)',
      language: 'python',
      enqueuedAt: Date.now(),
    });
    expect(result).toEqual({ mode: 'queued' });

    await waitFor(async () => {
      const row: any = await db.codingSubmission.findUnique({ where: { id: submissionId } });
      return row?.status === 'ACCEPTED' && row?.xpAwarded === true;
    });

    const row: any = await db.codingSubmission.findUnique({ where: { id: submissionId } });
    expect(row.status).toBe('ACCEPTED');
    expect(row.attempts).toBe(1); // exactly one processing pass
    expect(row.resultJson).toBeTruthy();
    const parsed = JSON.parse(row.resultJson);
    expect(parsed.verdict).toBe('ACCEPTED');
    expect(parsed.passed).toBe(2);
    expect(parsed.total).toBe(2);
    expect(parsed.perTestCase[1].hidden).toBe(true);

    const user: any = await db.user.findUnique({ where: { id: userId } });
    expect(user.xp).toBe(config.code.xpRewardSubmission);
  });

  it('dedupes on submissionId — a retried enqueue never double-runs', async () => {
    const userId = 'redis-u2';
    const problemId = 'redis-p2';
    const submissionId = 'redis-s2';
    await db.user.create({ data: { id: userId, email: 'redis-u2@test.dev', passwordHash: 'x', xp: 0 } });
    await db.codingProblem.create({
      data: {
        id: problemId,
        title: 'Redis Dedup',
        description: 'Once.',
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
        testcases: {
          create: [{ id: 'redis-tc3', inputData: '1', expectedOutput: '1', isHidden: false }],
        },
      },
    });
    await db.codingSubmission.create({
      data: {
        id: submissionId,
        userId,
        problemId,
        code: 'print(input())',
        language: 'python',
        status: 'QUEUED',
      },
    });

    const payload: SubmissionJobPayload = {
      submissionId,
      userId,
      problemId,
      code: 'print(input())',
      language: 'python',
      enqueuedAt: Date.now(),
    };
    // Two enqueues, same jobId — BullMQ must coalesce them.
    const [first, second] = await Promise.all([enqueueSubmission(payload), enqueueSubmission(payload)]);
    expect(first).toEqual({ mode: 'queued' });
    expect(second).toEqual({ mode: 'queued' });

    await waitFor(async () => {
      const row: any = await db.codingSubmission.findUnique({ where: { id: submissionId } });
      return row?.status === 'ACCEPTED';
    });

    // Exactly one job with this id exists across all states.
    const all = await queues.submission.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed']);
    expect(all.filter((j) => j.id === submissionId)).toHaveLength(1);

    const row: any = await db.codingSubmission.findUnique({ where: { id: submissionId } });
    expect(row.attempts).toBe(1); // processed exactly once
  });

  it('routes submission failures to the DLQ with originalQueue metadata', async () => {
    const userId = 'redis-u3';
    const submissionId = 'redis-s3';
    await db.user.create({ data: { id: userId, email: 'redis-u3@test.dev', passwordHash: 'x', xp: 0 } });
    await db.codingSubmission.create({
      data: {
        id: submissionId,
        userId,
        problemId: 'redis-missing-problem',
        code: 'print(1)',
        language: 'python',
        status: 'QUEUED',
      },
    });

    const deps: WorkerDeps = {
      db,
      logger,
      config,
      judge0Provider: makeFakeProvider(() => []),
      queues,
    };
    const outcome = await processSubmissionJob(
      {
        submissionId,
        userId,
        problemId: 'redis-missing-problem',
        code: 'print(1)',
        language: 'python',
      },
      deps
    );
    expect(outcome.status).toBe('SYSTEM_ERROR');

    const row: any = await db.codingSubmission.findUnique({ where: { id: submissionId } });
    expect(row.status).toBe('SYSTEM_ERROR');
    expect(row.errorMessage).toContain('Coding problem not found');

    const dlqJob = await queues.submissionDlq.getJob(`dlq-${submissionId}`);
    expect(dlqJob).not.toBeNull();
    expect(dlqJob!.data).toMatchObject({
      submissionId,
      userId,
      originalQueue: QUEUE_NAMES.submission,
    });
    expect(dlqJob!.name).toBe(JOB_NAMES.dlq);
  });

  it('requeues failed jobs via requeueFailedJobs (admin retry)', async () => {
    // Hermetic: the DLQ-failure test above leaves a failed job behind, and
    // requeueFailedJobs covers every failed job in the queue.
    await queues.submissionDlq.obliterate({ force: true });

    // A throwaway worker fails the job naturally (attempts: 1 → no retry),
    // leaving it in the failed state — the DLQ has no other consumers.
    const boomWorker = new Worker(
      QUEUE_NAMES.submissionDlq,
      async () => {
        throw new Error('boom');
      },
      { connection, prefix: config.queue.prefix }
    );
    try {
      await queues.submissionDlq.add(
        JOB_NAMES.dlq,
        { submissionId: 'redis-s9', userId: 'redis-u9', problemId: 'redis-p9' },
        { jobId: 'redis-dlq-retry-1', attempts: 1 }
      );
      await waitFor(async () => {
        const job = await queues.submissionDlq.getJob('redis-dlq-retry-1');
        return (await job?.getState()) === 'failed';
      });
    } finally {
      // Stop the consumer BEFORE requeueing, otherwise it re-picks the job
      // and the final state assertion races the worker.
      await boomWorker.close();
    }

    const { requeued } = await requeueFailedJobs(QUEUE_NAMES.submissionDlq);
    expect(requeued).toBe(1);

    const job = await queues.submissionDlq.getJob('redis-dlq-retry-1');
    expect(await job!.getState()).toBe('waiting');
  });

  it('reports queue metrics for all six queues when Redis is up', async () => {
    const metrics = await getQueueMetrics();
    expect(metrics.redisReachable).toBe(true);
    expect(metrics.queues).toHaveLength(6);
    const names = metrics.queues.map((q) => q.name).sort();
    expect(names).toEqual(
      [QUEUE_NAMES.submission, QUEUE_NAMES.evaluation, QUEUE_NAMES.result,
       QUEUE_NAMES.submissionDlq, QUEUE_NAMES.evaluationDlq, QUEUE_NAMES.resultDlq].sort()
    );
    for (const q of metrics.queues) {
      expect(q.waiting).toBeGreaterThanOrEqual(0);
      expect(q.completed).toBeGreaterThanOrEqual(0);
    }
  });

  it('writes readable worker heartbeats', async () => {
    const hb = startHeartbeat(connection, { judge0Name: 'fake' });
    hb.tickProcessed();
    hb.setCurrentJobId('redis-heartbeat-job');

    await waitFor(async () => {
      const beats = await readHeartbeats(connection);
      const mine = beats.find((b) => b.pid === process.pid);
      return mine?.jobsProcessed === 1;
    }, 5000, 50);

    const beats = await readHeartbeats(connection);
    const mine = beats.find((b) => b.pid === process.pid)!;
    expect(mine.judge0Name).toBe('fake');
    expect(mine.currentJobId).toBe('redis-heartbeat-job');
    expect(isWorkerHealthy(mine)).toBe(true);

    hb.stop();
    await connection.del(heartbeatKey(process.pid));
  });
});
