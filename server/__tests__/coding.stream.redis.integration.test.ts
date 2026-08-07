/**
 * Phase 5 — Redis integration tests for the realtime submission event bus.
 *
 * OPT-IN: set RUN_REDIS_TESTS=true and have Redis reachable at REDIS_URL
 * (default redis://127.0.0.1:6379 — `docker compose up -d redis`).
 *
 *   RUN_REDIS_TESTS=true npm test -- coding.stream.redis
 *
 * The suite is skipped when the gate is unset so `npm test` stays green in
 * environments without Redis. When the gate IS set but Redis is unreachable,
 * beforeAll fails loudly with a clear message.
 *
 * Verifies the real Redis pub/sub layer end-to-end:
 *   - publish → subscribe round trip (real PUBLISH / SUBSCRIBE)
 *   - closeSubmissionSubscriber stops delivery; resubscribing restores it
 *   - isSubmissionSubscriberActive tracks the lifecycle
 *   - the publish guard returns false within 1500ms when Redis is unreachable
 */
import Redis from 'ioredis';
import { config } from '../src/config';
import { createRedisConnection, redisPing } from '../src/config/redis';
import {
  SubmissionEvent,
  closeSubmissionSubscriber,
  isSubmissionSubscriberActive,
  publishSubmissionEvent,
  subscribeSubmissionEvents,
} from '../src/events/submissionEvents';

const RUN = process.env.RUN_REDIS_TESTS === 'true';
const describeFn = RUN ? describe : describe.skip;

function makeEvent(submissionId: string, status: string): SubmissionEvent {
  return {
    type: 'SUBMISSION_UPDATED',
    submissionId,
    userId: 'redis-sse-u1',
    status,
    stage: status === 'RUNNING' ? 'running' : 'done',
    createdAt: new Date().toISOString(),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(fn: () => boolean, timeoutMs = 5000, stepMs = 100): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}

describeFn('Phase 5 — Redis integration (submission event bus)', () => {
  let connection: Redis;

  beforeAll(async () => {
    if (!(await redisPing(2000))) {
      throw new Error(
        `RUN_REDIS_TESTS=true but Redis is unreachable at ${config.redis.url || 'redis://127.0.0.1:6379'}.\n` +
          'Start it with: docker compose up -d redis'
      );
    }
    connection = createRedisConnection();
    // Flush between runs: events from a previously crashed run would make
    // "expect no delivery" assertions flaky.
    await connection.flushdb();
  });

  afterAll(async () => {
    await closeSubmissionSubscriber();
    await connection?.quit().catch(() => {});
  });

  it('delivers published events to the subscribed handler (real PUBLISH/SUBSCRIBE)', async () => {
    const received: SubmissionEvent[] = [];
    await subscribeSubmissionEvents((e) => received.push(e));

    const sent = makeEvent('redis-sse-1', 'RUNNING');
    expect(await publishSubmissionEvent(sent)).toBe(true);

    await waitFor(() => received.length === 1);
    expect(received[0]).toMatchObject({
      type: 'SUBMISSION_UPDATED',
      submissionId: 'redis-sse-1',
      userId: 'redis-sse-u1',
      status: 'RUNNING',
      stage: 'running',
    });
    expect(received[0].createdAt).toBeTruthy();
  });

  it('closeSubmissionSubscriber stops delivery; resubscribing restores it', async () => {
    const received: SubmissionEvent[] = [];
    await subscribeSubmissionEvents((e) => received.push(e));
    await closeSubmissionSubscriber();
    expect(isSubmissionSubscriberActive()).toBe(false);

    await publishSubmissionEvent(makeEvent('redis-sse-2', 'RUNNING'));
    await sleep(400);
    expect(received).toHaveLength(0);

    await subscribeSubmissionEvents((e) => received.push(e));
    expect(isSubmissionSubscriberActive()).toBe(true);
    await publishSubmissionEvent(makeEvent('redis-sse-3', 'ACCEPTED'));
    await waitFor(() => received.length === 1);
    expect(received[0]).toMatchObject({ submissionId: 'redis-sse-3', status: 'ACCEPTED', stage: 'done' });
  });

  it('publish guard returns false within 1500ms when Redis is unreachable', async () => {
    const redisModule = await import('../src/config/redis');
    const spy = jest.spyOn(redisModule, 'createRedisConnection').mockImplementationOnce(() => {
      return new Redis('redis://127.0.0.1:16399', {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        retryStrategy: () => null,
        connectTimeout: 1000,
      });
    });
    try {
      const t0 = Date.now();
      const ok = await publishSubmissionEvent(makeEvent('redis-sse-guard', 'RUNNING'));
      expect(ok).toBe(false);
      expect(Date.now() - t0).toBeLessThan(1500);
    } finally {
      spy.mockRestore();
    }
  });
});
