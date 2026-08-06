/**
 * Phase 5 — coding API integration tests (supertest against the real app).
 *
 * Redis is mocked unreachable (redisPing → false) so submissions take the
 * inline fallback deterministically; a registered fake Judge0 provider makes
 * the inline chain return ACCEPTED. The monitoring controllers run for real
 * against mocked queue metrics so admin endpoints are deterministic without
 * BullMQ/Redis.
 *
 * Covers:
 *   - POST /coding/submissions: backward-compat 200 shape, inline ACCEPTED,
 *     validation 400s (missing/both refs, bad language, oversized code)
 *   - GET /coding/submissions/:id: owner 200 with hidden-testcase redaction,
 *     admin override, 404 non-owner/missing, 400 malformed id
 *   - Admin: queue status (403 student / 200 admin), worker status,
 *     requeue-failed (400 missing/unknown, 200 ok)
 */
import request from 'supertest';
import { app } from '../src/index';
import { registerMockJudge0 } from '../src/integrations/judge0/provider';
import { Judge0Provider } from '../src/integrations/judge0/types';

jest.mock('../src/config/redis', () => ({
  ...jest.requireActual('../src/config/redis'),
  redisPing: jest.fn().mockResolvedValue(false),
  createRedisConnection: jest.fn(() => ({
    keys: async () => [] as string[],
    mget: async () => [] as (string | null)[],
  })),
}));
jest.mock('../src/queues/queueService', () => ({
  ...jest.requireActual('../src/queues/queueService'),
  getQueueMetrics: jest.fn().mockResolvedValue({
    redisReachable: false,
    queues: [
      { name: 'code-submission', waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 },
      { name: 'code-evaluation', waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 },
      { name: 'result-processing', waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 },
      { name: 'code-submission-dlq', waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 },
      { name: 'code-evaluation-dlq', waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 },
      { name: 'result-processing-dlq', waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 },
    ],
  }),
  requeueFailedJobs: jest.fn().mockResolvedValue({ requeued: 2 }),
}));
jest.mock('../src/worker/heartbeat', () => ({
  ...jest.requireActual('../src/worker/heartbeat'),
  readHeartbeats: jest.fn().mockResolvedValue([]),
}));

/** Fake Judge0 provider: everything is ACCEPTED. */
const fakeProvider: Judge0Provider = {
  name: 'api-test',
  async submitBatch(reqs) {
    return reqs.map((_, i) => ({ token: `t${i}`, statusId: 3, verdict: 'ACCEPTED', stdout: '42', timeSec: 0.01, memoryKb: 1024 }));
  },
  async resolveLanguageId() { return 63; },
  async getLanguages() { return []; },
};

const PASSWORD = 'TestPassword2026!';

async function login(email: string, password: string): Promise<{ token: string; user: { id: string; role: string } }> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  return res.body;
}

let studentToken: string;
let adminToken: string;
let otherToken: string;
let otherUserId: string;
let unregister: () => void;
let challengeId: string;
let submissionId: string;

beforeAll(async () => {
  process.env.JUDGE0_PROVIDER_OVERRIDE = 'api-test';
  unregister = registerMockJudge0('api-test', fakeProvider);

  const student = await login('student@college.edu', 'StudentPassword2026!');
  studentToken = student.token;

  const admin = await login('admin@college.edu', 'AdminPassword2026!');
  adminToken = admin.token;

  // Second student (unique email per run so re-runs don't 409).
  const otherEmail = `other+${Date.now()}@test.dev`;
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: otherEmail, password: PASSWORD, fullName: 'Other Student' });
  expect([200, 201]).toContain(reg.status);
  const other = await login(otherEmail, PASSWORD);
  otherToken = other.token;
  otherUserId = other.user.id;

  // Admin creates a challenge with visible + hidden testcases for redaction checks.
  const create = await request(app)
    .post('/api/coding/challenges')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      title: `Phase5 API ${Date.now()}`,
      description: 'API test challenge',
      difficulty: 'EASY',
      timeLimitMs: 5000,
      testcases: [
        { inputData: '1', expectedOutput: '1', isHidden: false },
        { inputData: 'secret', expectedOutput: 'secret', isHidden: true },
      ],
    });
  expect(create.status).toBe(201);
  challengeId = create.body.data.id;
});

afterAll(() => {
  delete process.env.JUDGE0_PROVIDER_OVERRIDE;
  unregister();
});

describe('POST /api/coding/submissions', () => {
  it('runs inline to a terminal verdict with the backward-compatible shape', async () => {
    const res = await request(app)
      .post('/api/coding/submissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ problemId: challengeId, code: 'print(1)', language: 'python' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.submission).toMatchObject({
      id: expect.any(String),
      problemTitle: expect.any(String),
      language: 'python',
      status: 'SUCCESS',
    });
    expect(res.body.submission.timestamp).toBeDefined();
    submissionId = res.body.submission.id;
  });

  it('rejects when neither problemId nor problemTitle is provided', async () => {
    const res = await request(app)
      .post('/api/coding/submissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ code: 'print(1)', language: 'python' });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('fail');
  });

  it('rejects when both problemId and problemTitle are provided', async () => {
    const res = await request(app)
      .post('/api/coding/submissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ problemId: challengeId, problemTitle: 'Two Sum', code: 'print(1)', language: 'python' });
    expect(res.status).toBe(400);
  });

  it('rejects unsupported languages', async () => {
    const res = await request(app)
      .post('/api/coding/submissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ problemId: challengeId, code: 'x', language: 'brainfuck' });
    expect(res.status).toBe(400);
  });

  it('rejects oversized code payloads', async () => {
    const res = await request(app)
      .post('/api/coding/submissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ problemId: challengeId, code: 'a'.repeat(66_000), language: 'python' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/coding/submissions/:id', () => {
  it('returns the owner submission with hidden testcases redacted', async () => {
    const res = await request(app)
      .get(`/api/coding/submissions/${submissionId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.submission.id).toBe(submissionId);
    expect(res.body.submission.verdict).toBe('ACCEPTED');

    const perCase = res.body.submission.perTestCase;
    expect(perCase).toHaveLength(2);
    const visible = perCase.find((tc: any) => !tc.hidden);
    const hidden = perCase.find((tc: any) => tc.hidden);

    // Visible testcases keep stdout; hidden ones are stripped to metadata.
    expect(visible).toHaveProperty('stdout');
    expect(hidden).not.toHaveProperty('stdout');
    expect(hidden).not.toHaveProperty('inputData');
    expect(hidden).not.toHaveProperty('expectedOutput');
    expect(hidden).toMatchObject({ hidden: true, verdict: 'ACCEPTED' });
  });

  it('lets ADMIN read any submission', async () => {
    const res = await request(app)
      .get(`/api/coding/submissions/${submissionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.submission.id).toBe(submissionId);
  });

  it('returns 404 for a non-owner student', async () => {
    const res = await request(app)
      .get(`/api/coding/submissions/${submissionId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for a well-formed but unknown id', async () => {
    const res = await request(app)
      .get('/api/coding/submissions/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app)
      .get('/api/coding/submissions/bad id!')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(400);
  });
});

describe('Admin code-pipeline monitoring', () => {
  it('blocks students from queue status', async () => {
    const res = await request(app)
      .get('/api/admin/code/queue')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('returns queue status (degraded-200 shape) for admin', async () => {
    const res = await request(app)
      .get('/api/admin/code/queue')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.redisReachable).toBe(false);
    expect(res.body.data.queues).toHaveLength(6);
    expect(res.body.data.queues.map((q: any) => q.name)).toEqual(
      expect.arrayContaining(['code-submission', 'code-evaluation', 'result-processing'])
    );
  });

  it('returns worker status for admin', async () => {
    const res = await request(app)
      .get('/api/admin/code/worker')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data.workers)).toBe(true);
    expect(res.body.data.config).toMatchObject({
      xpRewardSubmission: expect.any(Number),
      maxTestcasesPerJob: expect.any(Number),
    });
  });

  it('requires queueName for requeue-failed', async () => {
    const res = await request(app)
      .post('/api/admin/code/queue/requeue-failed')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('reports the requeue count for a known queue', async () => {
    const res = await request(app)
      .post('/api/admin/code/queue/requeue-failed')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ queueName: 'code-evaluation' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ requeued: 2 });
  });
});
