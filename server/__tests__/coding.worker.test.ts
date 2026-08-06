/**
 * Phase 5 — worker processor unit tests.
 *
 * Pure functions over WorkerDeps with a fake db / fake Judge0Provider / fake
 * queues injected. No Redis, no network, no real DB. Verifies the full
 * submission → evaluation → result chain including verdict aggregation,
 * precedence, XP idempotency, the inline fallback, and DLQ payload shape.
 */
import { config } from '../src/config';
import {
  processSubmissionJob,
  handleSubmissionFailed,
} from '../src/worker/processSubmission';
import { processEvaluationJob } from '../src/worker/processEvaluation';
import { applyResultJob } from '../src/worker/processResult';
import {
  EvaluationJobPayload,
  SubmissionJobPayload,
  WorkerDeps,
} from '../src/worker/types';
import { Judge0CaseOutcome, Judge0Provider } from '../src/integrations/judge0/types';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

interface FakeUser { id: string; xp: number; email: string }
interface FakeSubmission {
  id: string; userId: string; problemId: string; code: string; language: string;
  status: string; executionMs?: number; memoryKb?: number; xpAwarded: boolean;
  errorMessage?: string; resultJson?: string; startedAt?: Date; completedAt?: Date;
  queueJobId?: string; attempts?: number;
}
interface FakeProblem { id: string; timeLimitMs: number; memoryLimitKb: number }
interface FakeTestcase { id: string; problemId: string; inputData: string; expectedOutput: string; isHidden: boolean; }

interface FakeDb {
  users: FakeUser[];
  submissions: FakeSubmission[];
  problems: FakeProblem[];
  testcases: FakeTestcase[];
}

function makeDb(seed: Partial<FakeDb> = {}): FakeDb {
  return {
    users: seed.users ?? [],
    submissions: seed.submissions ?? [],
    problems: seed.problems ?? [],
    testcases: seed.testcases ?? [],
  };
}

function makeDbProxy(db: FakeDb): any {
  /** Prisma model name -> FakeDb array key. */
  const TABLE: Record<string, string> = {
    codingSubmission: 'submissions',
    codingProblem: 'problems',
    user: 'users',
  };
  const arrFor = (model: string) => (db as any)[TABLE[model] ?? model];
  const findUnique = async (model: string, args: any) => {
    const arr = arrFor(model);
    if (!arr) return null;
    return arr.find((item: any) =>
      Object.keys(args.where).every((k) => item[k] === args.where[k])
    ) ?? null;
  };
  const findMany = async (model: string, args: any = {}) => {
    const arr = arrFor(model);
    if (!arr) return [];
    return arr.filter((item: any) => {
      const where = args.where ?? {};
      return Object.keys(where).every((k) => item[k] === where[k]);
    });
  };
  const facade: any = {
    async findUnique(args: any) { return findUnique(this._model, args); },
    async findMany(args: any) { return findMany(this._model, args); },
    async update(args: any) {
      const arr = arrFor(this._model);
      const idx = arr.findIndex((item: any) =>
        Object.keys(args.where).every((k) => item[k] === args.where[k])
      );
      if (idx === -1) throw new Error(`not found in ${this._model}`);
      const data = { ...args.data };
      if (data.xp && typeof data.xp === 'object' && 'increment' in data.xp) {
        arr[idx].xp = (arr[idx].xp ?? 0) + data.xp.increment;
        delete data.xp;
      }
      Object.assign(arr[idx], data);
      return arr[idx];
    },
    _model: '',
  };
  return new Proxy(facade, {
    get(_t, modelName: string) {
      if (modelName === '$connect' || modelName === '$disconnect') return async () => {};
      facade._model = modelName;
      return facade;
    },
  });
}

function makeFakeProvider(outcomes: () => Judge0CaseOutcome[]): Judge0Provider {
  return {
    name: 'fake',
    async submitBatch(reqs) {
      const o = outcomes();
      return reqs.map((_, i) => o[i] ?? { token: `t${i}`, statusId: 3, verdict: 'ACCEPTED' });
    },
    async resolveLanguageId() { return 71; },
    async getLanguages() { return []; },
  };
}

function makeFakeQueues() {
  const calls: any = { evaluation: [], result: [], submissionDlq: [], evaluationDlq: [], resultDlq: [] };
  const make = (bucket: string) => ({
    async add(_name: string, payload: any, _opts?: any) { calls[bucket].push(payload); },
  });
  return {
    calls,
    submission: make('submission'),
    evaluation: make('evaluation'),
    result: make('result'),
    submissionDlq: make('submissionDlq'),
    evaluationDlq: make('evaluationDlq'),
    resultDlq: make('resultDlq'),
  };
}

const silentLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as any;

function makeDeps(db: FakeDb, provider: Judge0Provider, queues: any = undefined): WorkerDeps {
  return { db: makeDbProxy(db), logger: silentLogger, config, judge0Provider: provider, queues };
}

function acOutcome(): Judge0CaseOutcome { return { token: 't', statusId: 3, verdict: 'ACCEPTED', timeSec: 0.01, memoryKb: 800 }; }
function waOutcome(): Judge0CaseOutcome { return { token: 't', statusId: 4, verdict: 'WRONG_ANSWER' }; }
function ceOutcome(): Judge0CaseOutcome { return { token: 't', statusId: 6, verdict: 'COMPILE_ERROR', compileOutput: 'error' }; }
function rteOutcome(): Judge0CaseOutcome { return { token: 't', statusId: 7, verdict: 'RUNTIME_ERROR' }; }
function tleOutcome(): Judge0CaseOutcome { return { token: 't', statusId: 5, verdict: 'TIME_LIMIT_EXCEEDED' }; }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('processEvaluationJob — verdict aggregation', () => {
  function seedAll(statuses: string[]) {
    const db = makeDb({
      problems: [{ id: 'p1', timeLimitMs: 2000, memoryLimitKb: 262144 }],
      testcases: statuses.map((_, i) => ({ id: `tc${i}`, problemId: 'p1', inputData: `${i}`, expectedOutput: `${i}`, isHidden: i === 1 })),
      submissions: [{ id: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python', status: 'RUNNING', xpAwarded: false }],
    });
    const outcomes = statuses.map((s) => {
      if (s === 'WA') return waOutcome();
      if (s === 'CE') return ceOutcome();
      if (s === 'RTE') return rteOutcome();
      if (s === 'TLE') return tleOutcome();
      return acOutcome();
    });
    const provider = makeFakeProvider(() => outcomes);
    const queues = makeFakeQueues();
    const payload: EvaluationJobPayload = {
      submissionId: 's1', userId: 'u1', problemId: 'p1', languageId: 71,
      testcases: db.testcases, code: 'x', language: 'python',
    };
    return { db, provider, queues, payload };
  }

  it('all ACCEPTED → ACCEPTED with resultJson + per-testcase fidelity', async () => {
    const { db, provider, queues, payload } = seedAll(['AC', 'AC']);
    const result = await processEvaluationJob(payload, makeDeps(db, provider, queues));
    expect(result.verdict).toBe('ACCEPTED');
    expect(result.passed).toBe(2);
    expect(result.total).toBe(2);
    const row = db.submissions[0];
    expect(row.status).toBe('ACCEPTED');
    expect(row.resultJson).toBeDefined();
    const parsed = JSON.parse(row.resultJson!);
    expect(parsed.perTestCase).toHaveLength(2);
    expect(parsed.perTestCase[1].hidden).toBe(true);
    expect(queues.calls.result).toHaveLength(1);
  });

  it('partial pass (1/2) → PARTIAL', async () => {
    const { db, provider, payload } = seedAll(['AC', 'WA']);
    const result = await processEvaluationJob(payload, makeDeps(db, provider));
    expect(result.verdict).toBe('PARTIAL');
    expect(db.submissions[0].status).toBe('PARTIAL');
  });

  it('compile-error precedence: one CE + one AC → COMPILE_ERROR', async () => {
    const { db, provider, payload } = seedAll(['CE', 'AC']);
    const result = await processEvaluationJob(payload, makeDeps(db, provider));
    expect(result.verdict).toBe('COMPILE_ERROR');
  });

  it('runtime-error precedence over wrong-answer', async () => {
    const { db, provider, payload } = seedAll(['RTE', 'WA']);
    const result = await processEvaluationJob(payload, makeDeps(db, provider));
    expect(result.verdict).toBe('RUNTIME_ERROR');
  });

  it('time-limit-exceeded precedence', async () => {
    const { db, provider, payload } = seedAll(['TLE', 'AC']);
    const result = await processEvaluationJob(payload, makeDeps(db, provider));
    expect(result.verdict).toBe('TIME_LIMIT_EXCEEDED');
  });

  it('all wrong → WRONG_ANSWER', async () => {
    const { db, provider, payload } = seedAll(['WA', 'WA']);
    const result = await processEvaluationJob(payload, makeDeps(db, provider));
    expect(result.verdict).toBe('WRONG_ANSWER');
  });
});

describe('applyResultJob — XP idempotency', () => {
  it('awards XP once for ACCEPTED and is idempotent', async () => {
    const db = makeDb({
      users: [{ id: 'u1', xp: 100, email: 'u@x.com' }],
      submissions: [{ id: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python', status: 'ACCEPTED', xpAwarded: false }],
    });
    const provider = makeFakeProvider(() => []);
    const payload = { submissionId: 's1', userId: 'u1', problemId: 'p1', verdict: 'ACCEPTED' };
    const r1 = await applyResultJob(payload, makeDeps(db, provider));
    expect(r1.xpAwarded).toBe(true);
    expect(db.users[0].xp).toBe(100 + config.code.xpRewardSubmission);
    expect(db.submissions[0].xpAwarded).toBe(true);
    // Second call: xpAwarded guard → no double award.
    const xpBefore = db.users[0].xp;
    const r2 = await applyResultJob(payload, makeDeps(db, provider));
    expect(r2.xpAwarded).toBe(true);
    expect(db.users[0].xp).toBe(xpBefore);
  });

  it('does not award XP for non-ACCEPTED verdicts', async () => {
    const db = makeDb({
      users: [{ id: 'u1', xp: 50, email: 'u@x.com' }],
      submissions: [{ id: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python', status: 'WRONG_ANSWER', xpAwarded: false }],
    });
    const provider = makeFakeProvider(() => []);
    const r = await applyResultJob({ submissionId: 's1', userId: 'u1', problemId: 'p1', verdict: 'WRONG_ANSWER' }, makeDeps(db, provider));
    expect(r.xpAwarded).toBe(false);
    expect(db.users[0].xp).toBe(50);
  });
});

describe('processSubmissionJob — intake + inline fallback', () => {
  it('marks RUNNING and enqueues evaluation when queues present', async () => {
    const db = makeDb({
      problems: [{ id: 'p1', timeLimitMs: 2000, memoryLimitKb: 262144 }],
      testcases: [{ id: 'tc1', problemId: 'p1', inputData: '1', expectedOutput: '1', isHidden: false }],
      submissions: [{ id: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python', status: 'QUEUED', xpAwarded: false }],
    });
    const provider = makeFakeProvider(() => [acOutcome()]);
    const queues = makeFakeQueues();
    const payload: SubmissionJobPayload = { submissionId: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python' };
    const r = await processSubmissionJob(payload, makeDeps(db, provider, queues));
    expect(r.status).toBe('QUEUED');
    expect(db.submissions[0].status).toBe('RUNNING');
    expect(queues.calls.evaluation).toHaveLength(1);
  });

  it('inline fallback (no queues) runs the full chain and returns terminal verdict', async () => {
    const db = makeDb({
      users: [{ id: 'u1', xp: 0, email: 'u@x.com' }],
      problems: [{ id: 'p1', timeLimitMs: 2000, memoryLimitKb: 262144 }],
      testcases: [{ id: 'tc1', problemId: 'p1', inputData: '1', expectedOutput: '1', isHidden: false }],
      submissions: [{ id: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python', status: 'QUEUED', xpAwarded: false }],
    });
    const provider = makeFakeProvider(() => [acOutcome()]);
    const payload: SubmissionJobPayload = { submissionId: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python' };
    const r = await processSubmissionJob(payload, makeDeps(db, provider));
    expect(r.status).toBe('ACCEPTED');
    expect(db.submissions[0].status).toBe('ACCEPTED');
    expect(db.submissions[0].xpAwarded).toBe(true);
    expect(db.users[0].xp).toBe(config.code.xpRewardSubmission);
  });

  it('is idempotent: terminal submission is a no-op', async () => {
    const db = makeDb({
      submissions: [{ id: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python', status: 'ACCEPTED', xpAwarded: true }],
    });
    const provider = makeFakeProvider(() => []);
    const queues = makeFakeQueues();
    const payload: SubmissionJobPayload = { submissionId: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python' };
    const r = await processSubmissionJob(payload, makeDeps(db, provider, queues));
    expect(r.status).toBe('ACCEPTED');
    expect(queues.calls.evaluation).toHaveLength(0);
  });

  it('missing problem → SYSTEM_ERROR + DLQ payload', async () => {
    const db = makeDb({
      submissions: [{ id: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python', status: 'QUEUED', xpAwarded: false }],
    });
    const provider = makeFakeProvider(() => []);
    const queues = makeFakeQueues();
    const payload: SubmissionJobPayload = { submissionId: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python' };
    const r = await processSubmissionJob(payload, makeDeps(db, provider, queues));
    expect(r.status).toBe('SYSTEM_ERROR');
    expect(db.submissions[0].status).toBe('SYSTEM_ERROR');
    expect(queues.calls.submissionDlq).toHaveLength(1);
    expect(queues.calls.submissionDlq[0].submissionId).toBe('s1');
  });
});

describe('handleSubmissionFailed', () => {
  it('persists SYSTEM_ERROR (message truncated to 500) and enqueues DLQ', async () => {
    const db = makeDb({
      submissions: [{ id: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python', status: 'RUNNING', xpAwarded: false }],
    });
    const provider = makeFakeProvider(() => []);
    const queues = makeFakeQueues();
    const payload: SubmissionJobPayload = { submissionId: 's1', userId: 'u1', problemId: 'p1', code: 'x', language: 'python' };
    const longReason = 'x'.repeat(1000);
    await handleSubmissionFailed(payload, makeDeps(db, provider, queues), longReason);
    expect(db.submissions[0].status).toBe('SYSTEM_ERROR');
    expect(db.submissions[0].errorMessage?.length).toBeLessThanOrEqual(500);
    expect(queues.calls.submissionDlq).toHaveLength(1);
    expect(queues.calls.submissionDlq[0].originalQueue).toBe('code-submission');
  });
});
