/**
 * Phase 5 — live Judge0 integration tests (real runner, real HTTP).
 *
 * OPT-IN: set RUN_LIVE_JUDGE0_TESTS=true and point the server at a reachable
 * Judge0 runner. Local CE via docker compose:
 *
 *   docker compose --profile judge0 up -d
 *   JUDGE0_API_URL=http://127.0.0.1:2358 \
 *   JUDGE0_AUTH_TYPE=none \
 *   RUN_LIVE_JUDGE0_TESTS=true npm test -- coding.live.judge0
 *
 * (Authenticated runners: set JUDGE0_API_TOKEN / JUDGE0_AUTH_TYPE=header.)
 * Do NOT set JUDGE0_PROVIDER_OVERRIDE — this suite constructs the real
 * Judge0HttpProvider directly.
 *
 * The suite is skipped when the gate is unset OR the provider is not
 * configured (see config.judge0.enabled). When the gate IS set and Judge0 is
 * configured but unreachable, beforeAll fails loudly.
 *
 * Verifies the real runner: verdict mapping (ACCEPTED / WRONG_ANSWER /
 * COMPILE_ERROR / RUNTIME_ERROR / TIME_LIMIT_EXCEEDED), language-id
 * resolution, and the full submission → evaluation → result pipeline inline.
 */
import { config, logger } from '../src/config';
import { db } from '../src/prisma/db';
import { Judge0HttpProvider } from '../src/integrations/judge0/provider';
import { resolveLanguageId } from '../src/integrations/judge0/languageMap';
import { processSubmissionJob } from '../src/worker/processSubmission';
import { WorkerDeps } from '../src/worker/types';
import { TransientJudge0Error } from '../src/integrations/judge0/types';

const RUN = process.env.RUN_LIVE_JUDGE0_TESTS === 'true';
const CONFIGURED = RUN && config.judge0.enabled;
const describeFn = CONFIGURED ? describe : describe.skip;

if (RUN && !config.judge0.enabled) {
  // eslint-disable-next-line no-console
  console.warn(
    '[coding.live.judge0] RUN_LIVE_JUDGE0_TESTS=true but Judge0 is not configured ' +
      '(set JUDGE0_API_URL + JUDGE0_API_TOKEN, or JUDGE0_AUTH_TYPE=none for a local no-auth runner) — skipping.'
  );
}

const PYTHON_ID = 71;

describeFn('Phase 5 — live Judge0 runner', () => {
  let provider: Judge0HttpProvider;
  const deps = () =>
    ({ db, logger, config, judge0Provider: provider }) as WorkerDeps;

  beforeAll(async () => {
    provider = new Judge0HttpProvider({});
    // Liveness probe: a trivial accepted run against the real runner.
    try {
      const outcomes = await provider.submitBatch([
        {
          sourceCode: 'print(1)',
          languageId: PYTHON_ID,
          stdin: '',
          expectedOutput: '1',
          cpuTimeLimitSec: 1,
          memoryLimitKb: 262144,
        },
      ]);
      if (outcomes[0]?.verdict !== 'ACCEPTED') {
        throw new Error(`liveness probe got verdict ${outcomes[0]?.verdict}`);
      }
    } catch (err: any) {
      if (err instanceof TransientJudge0Error) {
        throw new Error(
          `RUN_LIVE_JUDGE0_TESTS=true but Judge0 is unreachable at ${config.judge0.apiUrl}: ${err.message}\n` +
            'Start it with: docker compose --profile judge0 up -d'
        );
      }
      throw err;
    }
  });

  it('resolves static CE language ids', async () => {
    expect(await resolveLanguageId('python')).toBe(71);
    expect(await resolveLanguageId('python3')).toBe(71);
    expect(await resolveLanguageId('cpp')).toBe(54);
    expect(await resolveLanguageId('javascript')).toBe(63);
    expect(await resolveLanguageId('java')).toBe(62);
    expect(await resolveLanguageId('go')).toBe(60);
  });

  it('accepts a correct solution', async () => {
    const [o] = await provider.submitBatch([
      {
        sourceCode: 'print(int(input()) + 1)',
        languageId: PYTHON_ID,
        stdin: '41',
        expectedOutput: '42',
        cpuTimeLimitSec: 1,
        memoryLimitKb: 262144,
      },
    ]);
    expect(o.statusId).toBe(3);
    expect(o.verdict).toBe('ACCEPTED');
    expect(o.stdout?.trim()).toBe('42');
    expect(o.timeSec).toBeGreaterThan(0);
  });

  it('rejects a wrong answer', async () => {
    const [o] = await provider.submitBatch([
      {
        sourceCode: 'print(int(input()) + 1)',
        languageId: PYTHON_ID,
        stdin: '41',
        expectedOutput: '43',
        cpuTimeLimitSec: 1,
        memoryLimitKb: 262144,
      },
    ]);
    expect(o.statusId).toBe(4);
    expect(o.verdict).toBe('WRONG_ANSWER');
  });

  it('flags a compile error', async () => {
    const [o] = await provider.submitBatch([
      {
        sourceCode: 'def f(:',
        languageId: PYTHON_ID,
        stdin: '',
        expectedOutput: '',
        cpuTimeLimitSec: 1,
        memoryLimitKb: 262144,
      },
    ]);
    expect(o.statusId).toBe(6);
    expect(o.verdict).toBe('COMPILE_ERROR');
    expect(o.compileOutput).toBeTruthy();
  });

  it('flags a runtime error', async () => {
    const [o] = await provider.submitBatch([
      {
        sourceCode: 'print(1 / 0)',
        languageId: PYTHON_ID,
        stdin: '',
        expectedOutput: '',
        cpuTimeLimitSec: 1,
        memoryLimitKb: 262144,
      },
    ]);
    expect(o.statusId).toBe(7);
    expect(o.verdict).toBe('RUNTIME_ERROR');
    expect(o.stderr).toBeTruthy();
  });

  it('flags a time-limit exceedance', async () => {
    const [o] = await provider.submitBatch(
      [
        {
          sourceCode: 'while True: pass',
          languageId: PYTHON_ID,
          stdin: '',
          expectedOutput: '',
          cpuTimeLimitSec: 1,
          memoryLimitKb: 262144,
        },
      ],
      { timeoutMs: 15_000 }
    );
    expect(o.statusId).toBe(5);
    expect(o.verdict).toBe('TIME_LIMIT_EXCEEDED');
  }, 20_000);

  it('runs the full submission → evaluation → result chain inline (XP awarded)', async () => {
    const userId = 'live-u1';
    const problemId = 'live-p1';
    const submissionId = 'live-s1';
    await db.user.create({ data: { id: userId, email: 'live-u1@test.dev', passwordHash: 'x', xp: 0 } });
    await db.codingProblem.create({
      data: {
        id: problemId,
        title: 'Live Judge0 Sum',
        description: 'Add one.',
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
        testcases: {
          create: [
            { id: 'live-tc1', inputData: '41', expectedOutput: '42', isHidden: false },
            { id: 'live-tc2', inputData: '7', expectedOutput: '8', isHidden: true },
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

    const outcome = await processSubmissionJob(
      { submissionId, userId, problemId, code: 'print(int(input()) + 1)', language: 'python' },
      deps()
    );
    expect(outcome.status).toBe('ACCEPTED');

    const row: any = await db.codingSubmission.findUnique({ where: { id: submissionId } });
    expect(row.status).toBe('ACCEPTED');
    expect(row.xpAwarded).toBe(true);
    expect(row.executionMs).toBeGreaterThan(0);
    const parsed = JSON.parse(row.resultJson);
    expect(parsed.passed).toBe(2);
    expect(parsed.perTestCase[0].verdict).toBe('ACCEPTED');

    const user: any = await db.user.findUnique({ where: { id: userId } });
    expect(user.xp).toBe(config.code.xpRewardSubmission);
  });
});
