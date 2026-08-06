/**
 * Coding challenges + async submission pipeline (Phase 5).
 *
 * saveCodingSubmission now persists a QUEUED row and enqueues it; when Redis
 * is unreachable the submission runs inline through the same worker
 * processors, so the legacy synchronous behavior (and its tests) keep
 * working with no Redis. Response shape stays backward-compatible:
 * { id, problemTitle, language, status, timestamp, runtime?, memory? }.
 */
import { db } from '../prisma/db';
import { enqueueSubmission } from '../queues/queueService';

export async function getChallenges() {
  try {
    const problems = await db.codingProblem.findMany();
    if (problems.length > 0) {
      return problems.map((p: any) => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        solvedCount: Math.floor(Math.random() * 200) + 50
      }));
    }
  } catch (err: any) {
    console.warn('[Coding Service] DB challenge lookup offline, using static defaults.');
  }

  return [
    { id: 'c1', title: 'Two Sum', difficulty: 'EASY', solvedCount: 420 },
    { id: 'c2', title: 'Container With Most Water', difficulty: 'MEDIUM', solvedCount: 184 },
    { id: 'c3', title: 'Reverse Linked List', difficulty: 'EASY', solvedCount: 110 },
    { id: 'c4', title: 'Longest Common Subsequence', difficulty: 'HARD', solvedCount: 92 }
  ];
}

export async function createChallenge(data: {
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimitMs?: number;
  memoryLimitKb?: number;
  testcases?: Array<{ inputData: string; expectedOutput: string; isHidden?: boolean }>;
}) {
  const { title, description, difficulty, timeLimitMs, memoryLimitKb, testcases } = data;

  const problem = await db.codingProblem.create({
    data: {
      title,
      description,
      difficulty,
      timeLimitMs: timeLimitMs || 2000,
      memoryLimitKb: memoryLimitKb || 262144,
      testcases: {
        create: (testcases || []).map(tc => ({
          inputData: tc.inputData,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden ?? true
        }))
      }
    },
    include: { testcases: true }
  });

  return {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    testcaseCount: problem.testcases.length
  };
}

export async function deleteChallenge(id: string) {
  await db.codingProblem.delete({ where: { id } });
  return { success: true };
}

export async function addTestcase(problemId: string, data: { inputData: string; expectedOutput: string; isHidden?: boolean }) {
  const tc = await db.codingTestcase.create({
    data: {
      problemId,
      inputData: data.inputData,
      expectedOutput: data.expectedOutput,
      isHidden: data.isHidden ?? true
    }
  });
  return tc;
}

/**
 * Legacy status vocabulary → Phase 5 statuses.
 * ACCEPTED → 'SUCCESS' (legacy), non-terminal → 'PENDING', everything else
 * (WRONG_ANSWER, PARTIAL, COMPILE_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED,
 * SYSTEM_ERROR, TIMED_OUT, CANCELLED) passes through unchanged.
 */
export function mapSubmissionStatus(status: string): string {
  if (status === 'ACCEPTED') return 'SUCCESS';
  if (status === 'QUEUED' || status === 'RUNNING' || status === 'PENDING') return 'PENDING';
  return status;
}

export async function saveCodingSubmission(userId: string, data: any) {
  const { problemId, problemTitle, code, language } = data;
  const lang = language || 'python';

  let dbProblem = problemId
    ? await db.codingProblem.findUnique({ where: { id: problemId } })
    : await db.codingProblem.findFirst({ where: { title: problemTitle } });
  if (!dbProblem) {
    dbProblem = await db.codingProblem.create({
      data: {
        title: problemTitle || 'Two Sum',
        description: 'CS Coding Challenge',
        difficulty: 'MEDIUM'
      }
    });
  }

  const submission = await db.codingSubmission.create({
    data: {
      userId,
      problemId: dbProblem.id,
      code,
      language: lang,
      status: 'QUEUED'
    }
  });

  const result = await enqueueSubmission({
    submissionId: submission.id,
    userId,
    problemId: dbProblem.id,
    code,
    language: lang,
    enqueuedAt: Date.now()
  });

  let status = 'QUEUED';
  let runtime: number | undefined;
  let memory: number | undefined;
  if (result.mode === 'inline') {
    const final = await db.codingSubmission.findUnique({ where: { id: submission.id } });
    status = mapSubmissionStatus(final?.status || result.status);
    runtime = final?.executionMs ?? undefined;
    memory = final?.memoryKb ?? undefined;
  }

  return {
    id: submission.id,
    problemTitle: dbProblem.title,
    language: lang,
    status,
    timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(),
    runtime,
    memory
  };
}

/**
 * Single submission view. Hidden testcases are redacted to
 * { testcaseId, hidden, verdict, executionMs, memoryKb } — never
 * input/expected/stdout. Non-owners get 404 unless ADMIN.
 */
export async function getSubmissionById(id: string, userId: string, role: string) {
  const submission = await db.codingSubmission.findUnique({
    where: { id },
    include: { problem: true }
  });
  if (!submission) return null;
  if (submission.userId !== userId && role !== 'ADMIN') return null;

  let perTestCase: any[] | undefined;
  try {
    const parsed = submission.resultJson ? JSON.parse(submission.resultJson) : null;
    if (parsed && Array.isArray(parsed.perTestCase) && parsed.perTestCase.length > 0) {
      perTestCase = parsed.perTestCase.map((tc: any) => {
        if (tc.hidden) {
          return {
            testcaseId: tc.testcaseId,
            hidden: true,
            verdict: tc.verdict,
            executionMs: tc.executionMs,
            memoryKb: tc.memoryKb
          };
        }
        return {
          testcaseId: tc.testcaseId,
          hidden: false,
          verdict: tc.verdict,
          stdout: tc.stdout,
          stderr: tc.stderr,
          compileOutput: tc.compileOutput,
          executionMs: tc.executionMs,
          memoryKb: tc.memoryKb
        };
      });
    }
  } catch {
    perTestCase = undefined;
  }

  return {
    id: submission.id,
    problemId: submission.problemId,
    problemTitle: submission.problem?.title || 'Coding Problem',
    language: submission.language || 'python',
    code: submission.code,
    status: mapSubmissionStatus(submission.status),
    verdict: submission.status,
    executionMs: submission.executionMs ?? undefined,
    memoryKb: submission.memoryKb ?? undefined,
    createdAt: submission.createdAt,
    completedAt: submission.completedAt ?? undefined,
    errorMessage: submission.errorMessage ?? undefined,
    perTestCase
  };
}

export async function getUserCodingHistory(userId: string) {
  const attempts = await db.codingSubmission.findMany({
    where: { userId },
    include: { problem: true },
    orderBy: { createdAt: 'desc' }
  });

  return attempts.map((att: any) => ({
    problemTitle: att.problem?.title || 'Coding Problem',
    language: att.language || 'python',
    status: mapSubmissionStatus(att.status),
    timestamp: new Date(att.createdAt).toLocaleTimeString() + ' ' + new Date(att.createdAt).toLocaleDateString()
  }));
}
