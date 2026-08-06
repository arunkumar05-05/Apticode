/**
 * Phase 5 — stage 1 processor: submission intake.
 *
 * Idempotency guard (terminal rows are no-ops so a BullMQ redelivery never
 * double-runs), loads the problem + testcases (capped), marks the row
 * RUNNING, then either enqueues the evaluation job or runs the remaining
 * chain inline when no queues are present (API-side fallback).
 */
import { JOB_NAMES, QUEUE_NAMES } from '../queues/constants';
import {
  EvaluationJobPayload,
  SubmissionJobPayload,
  TERMINAL_STATUSES,
  WorkerDeps,
} from './types';
import { processEvaluationJob } from './processEvaluation';
import { applyResultJob } from './processResult';

export async function processSubmissionJob(
  payload: SubmissionJobPayload,
  deps: WorkerDeps
): Promise<{ status: string }> {
  const { db, logger, config, judge0Provider, queues } = deps;

  const existing = await db.codingSubmission.findUnique({ where: { id: payload.submissionId } });
  if (!existing) {
    logger.warn({ submissionId: payload.submissionId }, 'Submission not found — no-op');
    return { status: 'NOT_FOUND' };
  }
  if (TERMINAL_STATUSES.has(existing.status)) {
    logger.info({ submissionId: payload.submissionId, status: existing.status }, 'Submission already terminal — skipping');
    return { status: existing.status };
  }

  const problem = await db.codingProblem.findUnique({
    where: { id: payload.problemId },
    include: { testcases: true },
  });
  if (!problem) {
    await handleSubmissionFailed(payload, deps, 'Coding problem not found');
    return { status: 'SYSTEM_ERROR' };
  }

  const testcases = (problem.testcases || []).slice(0, config.judge0.maxTestcasesPerJob);

  await db.codingSubmission.update({
    where: { id: payload.submissionId },
    data: { status: 'RUNNING', startedAt: new Date(), queueJobId: payload.submissionId },
  });

  const languageId = await judge0Provider.resolveLanguageId(payload.language);
  const evaluation: EvaluationJobPayload = {
    submissionId: payload.submissionId,
    userId: payload.userId,
    problemId: payload.problemId,
    languageId,
    testcases: testcases.map((tc: any) => ({
      id: tc.id,
      inputData: tc.inputData,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
    })),
    code: payload.code,
    language: payload.language,
  };

  if (queues) {
    await queues.evaluation.add(JOB_NAMES.evaluation, evaluation, {
      jobId: `evaluation-${payload.submissionId}`,
    });
    return { status: 'QUEUED' };
  }

  // Inline fallback: run the full chain synchronously and return the verdict.
  const result = await processEvaluationJob(evaluation, deps);
  await applyResultJob(
    {
      submissionId: payload.submissionId,
      userId: payload.userId,
      problemId: payload.problemId,
      verdict: result.verdict,
    },
    deps
  );
  return { status: result.verdict };
}

export async function handleSubmissionFailed(
  payload: SubmissionJobPayload,
  deps: WorkerDeps,
  reason: unknown
): Promise<void> {
  const { db, logger, queues } = deps;
  const message = String(reason instanceof Error ? reason.message : reason).slice(0, 500);
  logger.warn({ submissionId: payload.submissionId, reason: message }, 'Marking submission SYSTEM_ERROR');
  await db.codingSubmission.update({
    where: { id: payload.submissionId },
    data: { status: 'SYSTEM_ERROR', errorMessage: message, completedAt: new Date() },
  });
  if (queues) {
    await queues.submissionDlq.add(
      JOB_NAMES.dlq,
      {
        submissionId: payload.submissionId,
        userId: payload.userId,
        problemId: payload.problemId,
        originalQueue: QUEUE_NAMES.submission,
        errorMessage: message,
      },
      { jobId: `dlq-${payload.submissionId}` }
    );
  }
}
