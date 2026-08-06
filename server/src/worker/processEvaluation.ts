/**
 * Phase 5 — stage 2 processor: judge the code.
 *
 * Builds Judge0 batch submissions from the payload testcases, clamps limits
 * to configured maximums (warn on clamp), aggregates per-case outcomes into
 * a single verdict, persists the terminal row (resultJson included), and
 * enqueues the result-apply job. A watchdog rejects with JobTimeoutError at
 * QUEUE_JOB_MAX_DURATION_MS → TIMED_OUT.
 *
 * Error policy:
 *  - FatalJudge0Error            → SYSTEM_ERROR + DLQ, return (no retry)
 *  - JobTimeoutError             → TIMED_OUT + DLQ, return (no retry)
 *  - TransientJudge0Error/other  → rethrow when queues exist (worker retries),
 *                                  else persist SYSTEM_ERROR and return
 */
import { config } from '../config';
import { JOB_NAMES, QUEUE_NAMES } from '../queues/constants';
import {
  FatalJudge0Error,
  JobTimeoutError,
  Judge0CaseOutcome,
  TransientJudge0Error,
} from '../integrations/judge0/types';
import {
  EvaluationJobPayload,
  Judge0CaseResult,
  SubmissionResult,
  WorkerDeps,
} from './types';

const VERDICT_PRECEDENCE = ['COMPILE_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED'];

export async function processEvaluationJob(
  payload: EvaluationJobPayload,
  deps: WorkerDeps
): Promise<SubmissionResult> {
  const { db, logger, queues } = deps;
  const startedAt = new Date();
  const startedMs = deps.clock?.() ?? Date.now();
  const submissionId = payload.submissionId;

  try {
    const result = await Promise.race([
      runEvaluation(payload, deps),
      new Promise<never>((_, reject) => {
        const ms = config.queue.jobMaxDurationMs;
        const timer = setTimeout(() => reject(new JobTimeoutError(`Judge0 job exceeded ${ms}ms`)), ms);
        timer.unref?.();
      }),
    ]);

    await persistResult(submissionId, result, deps);
    if (queues) {
      await queues.result.add(
        JOB_NAMES.result,
        {
          submissionId,
          userId: payload.userId,
          problemId: payload.problemId,
          verdict: result.verdict,
        },
        { jobId: `result-${submissionId}` }
      );
    }
    return result;
  } catch (err: any) {
    const message = String(err?.message || err).slice(0, 500);

    if (err instanceof JobTimeoutError) {
      logger.warn({ submissionId, message }, 'Evaluation timed out — TIMED_OUT');
      await persistFailure(submissionId, payload, deps, 'TIMED_OUT', message);
      return buildFailureResult('TIMED_OUT', startedAt, message);
    }

    if (err instanceof FatalJudge0Error) {
      logger.warn({ submissionId, status: err.status, message }, 'Fatal Judge0 error — SYSTEM_ERROR');
      await persistFailure(submissionId, payload, deps, 'SYSTEM_ERROR', message);
      return buildFailureResult('SYSTEM_ERROR', startedAt, message);
    }

    if (!queues) {
      logger.warn({ submissionId, message }, 'Inline evaluation failed — SYSTEM_ERROR');
      await persistFailure(submissionId, payload, deps, 'SYSTEM_ERROR', message);
      return buildFailureResult('SYSTEM_ERROR', startedAt, message);
    }

    // Transient (or unknown) with a real queue layer: rethrow for retry.
    throw err;
  }
}

async function runEvaluation(payload: EvaluationJobPayload, deps: WorkerDeps): Promise<SubmissionResult> {
  const { db, logger, config, judge0Provider } = deps;

  const problem = await db.codingProblem.findUnique({
    where: { id: payload.problemId },
    select: { timeLimitMs: true, memoryLimitKb: true },
  });

  const rawCpu = (problem?.timeLimitMs ?? 2000) / 1000;
  const cpuTimeLimitSec = clampCpu(rawCpu, config.judge0.maxCpuSeconds, payload.submissionId, logger);
  const memoryLimitKb = clampMemory(problem?.memoryLimitKb ?? 262144, config.judge0.maxMemoryKb, payload.submissionId, logger);

  const startedMs = deps.clock?.() ?? Date.now();
  const outcomes = await judge0Provider.submitBatch(
    payload.testcases.map((tc) => ({
      sourceCode: payload.code,
      languageId: payload.languageId,
      stdin: tc.inputData,
      expectedOutput: tc.expectedOutput,
      cpuTimeLimitSec,
      memoryLimitKb,
    }))
  );

  return aggregateOutcomes(payload, outcomes, startedMs, deps);
}

function clampCpu(value: number, max: number, submissionId: string, logger: any): number {
  if (value > max) {
    logger.warn({ submissionId, requested: value, max }, 'CPU limit clamped to configured maximum');
    return max;
  }
  return Math.max(0.1, value);
}

function clampMemory(value: number, max: number, submissionId: string, logger: any): number {
  if (value > max) {
    logger.warn({ submissionId, requested: value, max }, 'Memory limit clamped to configured maximum');
    return max;
  }
  return Math.max(1024, value);
}

function aggregateOutcomes(
  payload: EvaluationJobPayload,
  outcomes: Judge0CaseOutcome[],
  startedMs: number,
  deps: WorkerDeps
): SubmissionResult {
  const completedAt = new Date();
  const durationMs = (deps.clock?.() ?? Date.now()) - startedMs;

  const perTestCase: Judge0CaseResult[] = payload.testcases.map((tc, i) => {
    const o = outcomes[i];
    return {
      testcaseId: tc.id,
      hidden: tc.isHidden,
      statusId: o?.statusId ?? 1,
      verdict: o?.verdict ?? 'PENDING',
      stdout: o?.stdout,
      stderr: o?.stderr,
      compileOutput: o?.compileOutput,
      executionMs: o?.timeSec != null ? Math.round(o.timeSec * 1000) : undefined,
      memoryKb: o?.memoryKb,
    };
  });

  const passed = perTestCase.filter((tc) => tc.verdict === 'ACCEPTED').length;
  const total = perTestCase.length;
  const verdict = aggregateVerdict(perTestCase, passed, total);

  const executionMs = perTestCase.reduce<number | undefined>((max, tc) => {
    if (tc.executionMs == null) return max;
    return max == null || tc.executionMs > max ? tc.executionMs : max;
  }, undefined);
  const memoryKb = perTestCase.reduce<number | undefined>((max, tc) => {
    if (tc.memoryKb == null) return max;
    return max == null || tc.memoryKb > max ? tc.memoryKb : max;
  }, undefined);

  return {
    verdict,
    passed,
    total,
    compileOutput: perTestCase.find((tc) => tc.compileOutput)?.compileOutput,
    stdout: perTestCase.find((tc) => tc.stdout)?.stdout,
    stderr: perTestCase.find((tc) => tc.stderr)?.stderr,
    executionMs,
    memoryKb,
    perTestCase,
    startedAt: new Date(startedMs),
    completedAt,
    durationMs,
    attempts: 1,
  };
}

function aggregateVerdict(perTestCase: Judge0CaseResult[], passed: number, total: number): string {
  for (const v of VERDICT_PRECEDENCE) {
    if (perTestCase.some((tc) => tc.verdict === v)) return v;
  }
  if (passed === total) return 'ACCEPTED';
  if (passed > 0) return 'PARTIAL';
  return 'WRONG_ANSWER';
}

async function persistResult(submissionId: string, result: SubmissionResult, deps: WorkerDeps): Promise<void> {
  const { db } = deps;
  const row = await db.codingSubmission.findUnique({ where: { id: submissionId } });
  await db.codingSubmission.update({
    where: { id: submissionId },
    data: {
      status: result.verdict,
      executionMs: result.executionMs,
      memoryKb: result.memoryKb,
      completedAt: result.completedAt,
      resultJson: JSON.stringify(result),
      attempts: (row?.attempts ?? 0) + 1,
    },
  });
  deps.publish?.({
    type: 'SUBMISSION_UPDATED',
    submissionId,
    userId: row?.userId ?? '',
    status: result.verdict,
    stage: 'done',
    createdAt: new Date().toISOString(),
  });
}

async function persistFailure(
  submissionId: string,
  payload: EvaluationJobPayload,
  deps: WorkerDeps,
  status: string,
  message: string
): Promise<void> {
  const { db, queues } = deps;
  await db.codingSubmission.update({
    where: { id: submissionId },
    data: { status, errorMessage: message, completedAt: new Date() },
  });
  deps.publish?.({
    type: 'SUBMISSION_UPDATED',
    submissionId,
    userId: payload.userId,
    status,
    stage: status === 'TIMED_OUT' ? 'done' : 'error',
    message,
    createdAt: new Date().toISOString(),
  });
  if (queues) {
    await queues.evaluationDlq.add(
      JOB_NAMES.dlq,
      {
        submissionId,
        userId: payload.userId,
        problemId: payload.problemId,
        originalQueue: QUEUE_NAMES.evaluation,
        errorMessage: message,
      },
      { jobId: `dlq-${submissionId}` }
    );
  }
}

function buildFailureResult(verdict: string, startedAt: Date, message: string): SubmissionResult {
  const completedAt = new Date();
  return {
    verdict,
    passed: 0,
    total: 0,
    stderr: message,
    perTestCase: [],
    startedAt,
    completedAt,
    durationMs: completedAt.getTime() - startedAt.getTime(),
    attempts: 1,
  };
}
