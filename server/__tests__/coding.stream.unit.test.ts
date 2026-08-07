/**
 * Phase 5 — realtime submission stream unit tests (hermetic).
 *
 * Redis is replaced by an in-memory pub/sub fake so the publish → subscribe
 * → dispatch → SSE chain runs for real without a Redis server. The Express
 * app serves the actual SSE endpoint over raw http so connections can stay
 * open and be torn down deterministically.
 *
 * Covers:
 *   - formatSseEvent wire format
 *   - route registration before /coding/submissions/:id
 *   - 401 without auth, SSE headers, initial ping, heartbeat interval
 *   - end-to-end event delivery through the in-memory bus
 *   - per-user and per-submission fan-out filtering
 *   - per-user client cap (5) dropping the oldest
 *   - closed-client pruning from the registry
 *   - subscriber lifecycle (active → closed → resubscribe)
 *   - publish guard returning false within 1500ms when Redis hangs
 */
process.env.SSE_HEARTBEAT_INTERVAL_MS = '200';

import http from 'http';
import type { AddressInfo } from 'net';
import request from 'supertest';
import { app } from '../src/index';
import { formatSseEvent } from '../src/controllers/submissionStreamController';
import {
  SubmissionEvent,
  closeSubmissionSubscriber,
  dispatchSubmissionEvent,
  getStreamClientCount,
  isSubmissionSubscriberActive,
  publishSubmissionEvent,
  subscribeSubmissionEvents,
} from '../src/events/submissionEvents';

jest.mock('../src/config/redis', () => {
  const actual = jest.requireActual('../src/config/redis');
  const instances: any[] = [];
  let hangingMode = false;

  class FakeRedis {
    status = 'ready';
    stream = { unref: () => {} };
    private messageHandler: ((channel: string, message: string) => void) | null = null;

    on(event: string, cb: (channel: string, message: string) => void) {
      if (event === 'message') this.messageHandler = cb;
      return this;
    }

    async subscribe(_channel: string) {}

    async publish(channel: string, message: string) {
      if (hangingMode) return new Promise(() => {});
      for (const sub of instances) {
        if (sub !== this && sub.messageHandler) sub.messageHandler(channel, message);
      }
      return 1;
    }

    async quit() {
      return 'OK';
    }

    disconnect() {}
  }

  return {
    ...actual,
    __instances: instances,
    __setHanging(v: boolean) {
      hangingMode = v;
    },
    createRedisConnection: jest.fn(() => {
      const conn = new FakeRedis();
      instances.push(conn);
      return conn;
    }),
    redisPing: jest.fn(async () => true),
  };
});

const PASSWORD = 'TestPassword2026!';

async function login(email: string, password: string): Promise<{ token: string; user: { id: string; role: string } }> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  return res.body;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(fn: () => boolean, timeoutMs = 3000, stepMs = 25): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}

interface StreamHandle {
  req: http.ClientRequest;
  res: http.IncomingMessage;
  data: () => string;
  close: () => void;
  waitFor: (pred: (data: string) => boolean, timeoutMs?: number) => Promise<void>;
}

function openStream(port: number, token: string, submissionId?: string): Promise<StreamHandle> {
  return new Promise((resolve, reject) => {
    const query = submissionId ? `?submissionId=${encodeURIComponent(submissionId)}` : '';
    const req = http.get(
      {
        host: '127.0.0.1',
        port,
        path: `/api/coding/submissions/stream${query}`,
        headers: { Authorization: `Bearer ${token}` },
      },
      (res) => {
        const chunks: string[] = [];
        const handle: StreamHandle = {
          req,
          res,
          data: () => chunks.join(''),
          close: () => req.destroy(),
          waitFor: (pred, timeoutMs = 3000) => waitFor(() => pred(handle.data()), timeoutMs),
        };
        res.on('data', (c: Buffer) => chunks.push(c.toString()));
        res.on('error', () => {});
        resolve(handle);
      }
    );
    req.on('error', reject);
  });
}

function makeEvent(submissionId: string, userId: string, status: string): SubmissionEvent {
  return {
    type: 'SUBMISSION_UPDATED',
    submissionId,
    userId,
    status,
    stage: status === 'RUNNING' ? 'running' : 'done',
    createdAt: new Date().toISOString(),
  };
}

let server: http.Server;
let port: number;
let studentToken: string;
let studentId: string;
let otherToken: string;
let otherId: string;
const open: StreamHandle[] = [];

beforeAll(async () => {
  const student = await login('student@college.edu', 'StudentPassword2026!');
  studentToken = student.token;
  studentId = student.user.id;

  const otherEmail = `stream-other+${Date.now()}@test.dev`;
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: otherEmail, password: PASSWORD, fullName: 'Other Student' });
  expect([200, 201]).toContain(reg.status);
  const other = await login(otherEmail, PASSWORD);
  otherToken = other.token;
  otherId = other.user.id;

  server = app.listen(0);
  port = (server.address() as AddressInfo).port;
});

afterEach(async () => {
  for (const h of open.splice(0)) h.close();
  await sleep(150);
});

afterAll(async () => {
  await closeSubmissionSubscriber();
  server?.close();
  server?.closeAllConnections?.();
});

describe('formatSseEvent — wire format', () => {
  it('emits an event + data line pair terminated by a blank line', () => {
    const evt: SubmissionEvent = {
      type: 'SUBMISSION_UPDATED',
      submissionId: 's1',
      userId: 'u1',
      status: 'RUNNING',
      stage: 'running',
      createdAt: '2026-08-06T00:00:00.000Z',
    };
    expect(formatSseEvent(evt)).toBe(`event: submission\ndata: ${JSON.stringify(evt)}\n\n`);
  });
});

describe('GET /api/coding/submissions/stream', () => {
  it('rejects unauthenticated clients with 401', async () => {
    const res = await request(app).get('/api/coding/submissions/stream');
    expect(res.status).toBe(401);
  });

  it('is registered before /:id and streams SSE headers, no compression, and an initial ping', async () => {
    const h = await openStream(port, studentToken);
    open.push(h);
    // A 400 here would mean /coding/submissions/:id swallowed the route.
    expect(h.res.statusCode).toBe(200);
    expect(h.res.headers['content-type']).toContain('text/event-stream');
    expect(h.res.headers['cache-control']).toContain('no-cache');
    expect(h.res.headers['cache-control']).toContain('no-transform');
    expect(h.res.headers['x-accel-buffering']).toBe('no');
    expect(h.res.headers['content-encoding']).toBeUndefined();
    await h.waitFor((d) => d.includes(': ping\n\n'));
  });

  it('emits heartbeat frames on the configured interval', async () => {
    const h = await openStream(port, studentToken);
    open.push(h);
    await waitFor(() => h.data().split(': ping\n\n').length - 1 >= 2, 2000, 50);
  });

  it('delivers a published event end-to-end through the in-memory bus', async () => {
    const received: SubmissionEvent[] = [];
    // Mirrors the createApp() wiring: subscriber → dispatch → SSE clients.
    await subscribeSubmissionEvents((e) => {
      received.push(e);
      dispatchSubmissionEvent(e);
    });
    const h = await openStream(port, studentToken, 'sse-u-s1');
    open.push(h);

    const evt = makeEvent('sse-u-s1', studentId, 'ACCEPTED');
    expect(await publishSubmissionEvent(evt)).toBe(true);

    await h.waitFor((d) => d.includes(`event: submission\ndata: ${JSON.stringify(evt)}`));
    await waitFor(() => received.length === 1);
    expect(received[0]).toMatchObject({ submissionId: 'sse-u-s1', userId: studentId, status: 'ACCEPTED' });
  });

  it('fans out by userId — another user never receives the event', async () => {
    const me = await openStream(port, studentToken);
    const them = await openStream(port, otherToken);
    open.push(me, them);
    await subscribeSubmissionEvents((e) => dispatchSubmissionEvent(e));

    await publishSubmissionEvent(makeEvent('sse-f1', studentId, 'RUNNING'));
    await me.waitFor((d) => d.includes('sse-f1'));
    await sleep(400);
    expect(them.data()).not.toContain('sse-f1');
  });

  it('fans out by submissionId — sibling streams never receive the event', async () => {
    const a = await openStream(port, studentToken, 'sse-f-a');
    const b = await openStream(port, studentToken, 'sse-f-b');
    open.push(a, b);
    await subscribeSubmissionEvents((e) => dispatchSubmissionEvent(e));

    await publishSubmissionEvent(makeEvent('sse-f-a', studentId, 'RUNNING'));
    await a.waitFor((d) => d.includes('sse-f-a'));
    await sleep(400);
    expect(b.data()).not.toContain('sse-f-a');
  });

  it('caps concurrent clients per user at 5, dropping the oldest', async () => {
    for (let i = 0; i < 6; i++) {
      open.push(await openStream(port, studentToken));
    }
    await sleep(200);
    expect(getStreamClientCount()).toBe(5);
  });

  it('prunes closed clients from the registry', async () => {
    const h = await openStream(port, studentToken);
    open.push(h);
    await waitFor(() => getStreamClientCount() > 0);
    h.close();
    await waitFor(() => getStreamClientCount() === 0);
  });
});

describe('subscriber lifecycle + publish guard', () => {
  it('tracks active → closed → resubscribe transitions', async () => {
    await closeSubmissionSubscriber();
    expect(isSubmissionSubscriberActive()).toBe(false);
    await subscribeSubmissionEvents(() => {});
    expect(isSubmissionSubscriberActive()).toBe(true);
    await closeSubmissionSubscriber();
    expect(isSubmissionSubscriberActive()).toBe(false);
    await subscribeSubmissionEvents(() => {});
    expect(isSubmissionSubscriberActive()).toBe(true);
  });

  it('returns false within 1500ms when Redis hangs', async () => {
    const redisMock = jest.requireMock('../src/config/redis') as any;
    redisMock.__setHanging(true);
    try {
      const t0 = Date.now();
      const ok = await publishSubmissionEvent(makeEvent('sse-hang', studentId, 'RUNNING'));
      expect(ok).toBe(false);
      expect(Date.now() - t0).toBeLessThan(1500);
    } finally {
      redisMock.__setHanging(false);
    }
  });
});
