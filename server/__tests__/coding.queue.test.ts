/**
 * Phase 5 — queue service unit tests.
 *
 * Hermetic: `../src/config/redis`, `../src/queues/factory`, the Judge0
 * provider, and the worker processors are all mocked, so no Redis connection
 * is ever attempted and nothing is enqueued for real. Because queueService
 * keeps module-level caches (pingCache, queueSet), every test loads a fresh
 * module instance via jest.resetModules() + require().
 *
 * Verifies:
 *   - QUEUE_NAMES / JOB_NAMES constants (the user-specified pipeline names)
 *   - QUEUE_OPTIONS defaults (attempts / exponential backoff / retention)
 *   - redisReachable() 5s TTL caching (both truthy and falsy outcomes)
 *   - enqueueSubmission(): queued path (dedup jobId) and inline fallback
 *   - getQueueMetrics(): happy path + degraded-200 when Redis is down
 *   - requeueFailedJobs(): retry fan-out, per-job error tolerance, unknown
 *     queue rejection
 */
import { config } from '../src/config';
import { JOB_NAMES, QUEUE_NAMES, QUEUE_OPTIONS } from '../src/queues/constants';
import type { QueueMetrics } from '../src/queues/queueService';

jest.mock('../src/config/redis', () => ({ redisPing: jest.fn() }));
jest.mock('../src/queues/factory', () => ({ createQueues: jest.fn() }));
jest.mock('../src/worker/processSubmission', () => ({
  processSubmissionJob: jest.fn(),
  handleSubmissionFailed: jest.fn(),
}));
jest.mock('../src/integrations/judge0/provider', () => ({
  createJudge0Provider: jest.fn(() => ({ name: 'fake-provider' })),
}));

/** Fresh module instances per test (module-level caches reset). */
function fresh() {
  const qs = require('../src/queues/queueService');
  return {
    qs,
    redisPing: require('../src/config/redis').redisPing as jest.Mock,
    createQueues: require('../src/queues/factory').createQueues as jest.Mock,
    processSubmissionJob: require('../src/worker/processSubmission').processSubmissionJob as jest.Mock,
  };
}

/** Fake BullMQ Queue with spies on the methods the service touches. */
function fakeQueue() {
  return {
    add: jest.fn().mockResolvedValue(undefined),
    getJobCounts: jest.fn().mockResolvedValue({
      waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0,
    }),
    getMetrics: jest.fn().mockResolvedValue({ mean: 100, max: 200 }),
    getFailed: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

function fakeQueueSet() {
  return {
    submission: fakeQueue(),
    evaluation: fakeQueue(),
    result: fakeQueue(),
    submissionDlq: fakeQueue(),
    evaluationDlq: fakeQueue(),
    resultDlq: fakeQueue(),
  };
}

const payload = { submissionId: 's1', userId: 'u1', problemId: 'p1', code: 'print(1)', language: 'python' };

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('QUEUE_NAMES / JOB_NAMES constants', () => {
  it('uses the user-specified three-stage pipeline names', () => {
    expect(QUEUE_NAMES.submission).toBe('code-submission');
    expect(QUEUE_NAMES.evaluation).toBe('code-evaluation');
    expect(QUEUE_NAMES.result).toBe('result-processing');
  });

  it('names DLQs as <queue>-dlq', () => {
    expect(QUEUE_NAMES.submissionDlq).toBe('code-submission-dlq');
    expect(QUEUE_NAMES.evaluationDlq).toBe('code-evaluation-dlq');
    expect(QUEUE_NAMES.resultDlq).toBe('result-processing-dlq');
  });

  it('uses dotted job names per stage', () => {
    expect(JOB_NAMES.submission).toBe('submission.run');
    expect(JOB_NAMES.evaluation).toBe('evaluation.run');
    expect(JOB_NAMES.result).toBe('result.apply');
    expect(JOB_NAMES.dlq).toBe('dlq.retain');
  });
});

describe('QUEUE_OPTIONS defaults', () => {
  it('submission/evaluation use config attempts with exponential backoff', () => {
    const sub = QUEUE_OPTIONS.submission;
    expect(sub.attempts).toBe(config.queue.submissionAttempts);
    expect(sub.backoff).toEqual({ type: 'exponential', delay: config.queue.submissionBackoffMs });
    expect(sub.removeOnComplete).toMatchObject({ count: 1000 });
  });

  it('result queue uses result attempts', () => {
    expect(QUEUE_OPTIONS.result.attempts).toBe(config.queue.resultAttempts);
  });

  it('DLQ keeps everything', () => {
    expect(QUEUE_OPTIONS.dlq).toEqual({ removeOnComplete: false, removeOnFail: false });
  });
});

describe('redisReachable TTL cache', () => {
  it('caches a reachable result for 5s, then re-probes', async () => {
    const { qs, redisPing } = fresh();
    redisPing.mockResolvedValue(true);
    expect(await qs.redisReachable()).toBe(true);
    expect(await qs.redisReachable()).toBe(true);
    expect(redisPing).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(5_100);
    expect(await qs.redisReachable()).toBe(true);
    expect(redisPing).toHaveBeenCalledTimes(2);
  });

  it('caches an unreachable result too (no hammering)', async () => {
    const { qs, redisPing } = fresh();
    redisPing.mockResolvedValue(false);
    expect(await qs.redisReachable()).toBe(false);
    expect(await qs.redisReachable()).toBe(false);
    expect(redisPing).toHaveBeenCalledTimes(1);
  });
});

describe('enqueueSubmission', () => {
  it('enqueues with dedup jobId when Redis is reachable', async () => {
    const { qs, createQueues, redisPing } = fresh();
    redisPing.mockResolvedValue(true);
    const queues = fakeQueueSet();
    createQueues.mockReturnValue(queues);

    const res = await qs.enqueueSubmission(payload);

    expect(res).toEqual({ mode: 'queued' });
    expect(queues.submission.add).toHaveBeenCalledTimes(1);
    expect(queues.submission.add).toHaveBeenCalledWith(JOB_NAMES.submission, payload, { jobId: 's1' });
    // Dedup: the jobId must be the submission id, so retries never double-enqueue.
    expect(queues.submission.add.mock.calls[0][2]).toMatchObject({ jobId: 's1' });
  });

  it('runs inline through the same processor when Redis is down', async () => {
    const { qs, redisPing, processSubmissionJob, createQueues } = fresh();
    redisPing.mockResolvedValue(false);
    processSubmissionJob.mockResolvedValue({ status: 'ACCEPTED' });

    const res = await qs.enqueueSubmission(payload);

    expect(res).toEqual({ mode: 'inline', status: 'ACCEPTED' });
    expect(processSubmissionJob).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({ judge0Provider: { name: 'fake-provider' } })
    );
    // Nothing was enqueued — queues are never even constructed in inline mode.
    expect(createQueues).not.toHaveBeenCalled();
  });
});

describe('getQueueMetrics', () => {
  it('returns per-queue counts + timing from BullMQ', async () => {
    const { qs, createQueues, redisPing } = fresh();
    redisPing.mockResolvedValue(true);
    const queues = fakeQueueSet();
    queues.submission.getJobCounts.mockResolvedValue({
      waiting: 3, active: 1, completed: 9, failed: 2, delayed: 0, paused: 0,
    });
    queues.submission.getMetrics.mockResolvedValue({ mean: 123.4, max: 456.7 });
    createQueues.mockReturnValue(queues);

    const metrics: QueueMetrics = await qs.getQueueMetrics();

    expect(metrics.redisReachable).toBe(true);
    expect(metrics.queues).toHaveLength(6);
    const sub = metrics.queues.find((q: any) => q.name === 'code-submission');
    expect(sub).toMatchObject({ waiting: 3, active: 1, completed: 9, failed: 2 });
    expect(sub?.avgCompletedMs).toBe(123);
    expect(sub?.maxCompletedMs).toBe(457);
  });

  it('degrades to a 200-safe zeroed payload when Redis is down', async () => {
    const { qs, createQueues, redisPing } = fresh();
    redisPing.mockResolvedValue(true);
    const queues = fakeQueueSet();
    queues.result.getJobCounts.mockRejectedValue(new Error('connection refused'));
    createQueues.mockReturnValue(queues);

    const metrics: QueueMetrics = await qs.getQueueMetrics();

    expect(metrics.redisReachable).toBe(false);
    expect(metrics.queues).toHaveLength(6);
    for (const q of metrics.queues) {
      expect(q.waiting).toBe(0);
      expect(q.avgCompletedMs).toBeUndefined();
    }
  });
});

describe('requeueFailedJobs', () => {
  it('retries every failed job and reports the count', async () => {
    const { qs, createQueues } = fresh();
    const queues = fakeQueueSet();
    queues.evaluation.getFailed.mockResolvedValue([
      { id: '1', retry: jest.fn().mockResolvedValue(undefined) },
      { id: '2', retry: jest.fn().mockResolvedValue(undefined) },
    ]);
    createQueues.mockReturnValue(queues);

    const res = await qs.requeueFailedJobs(QUEUE_NAMES.evaluation);

    expect(res).toEqual({ requeued: 2 });
    expect(queues.evaluation.getFailed).toHaveBeenCalled();
  });

  it('tolerates individual retry failures and skips them', async () => {
    const { qs, createQueues } = fresh();
    const queues = fakeQueueSet();
    queues.result.getFailed.mockResolvedValue([
      { id: '1', retry: jest.fn().mockResolvedValue(undefined) },
      { id: '2', retry: jest.fn().mockRejectedValue(new Error('already locked')) },
    ]);
    createQueues.mockReturnValue(queues);

    const res = await qs.requeueFailedJobs(QUEUE_NAMES.result);

    expect(res).toEqual({ requeued: 1 });
  });

  it('rejects for unknown queue names', async () => {
    const { qs } = fresh();
    await expect(qs.requeueFailedJobs('not-a-queue')).rejects.toThrow('Unknown queue');
  });
});
