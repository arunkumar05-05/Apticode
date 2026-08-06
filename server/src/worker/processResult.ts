/**
 * Phase 5 — stage 3 processor: apply results.
 *
 * Grants the configured XP reward exactly once per ACCEPTED submission
 * (guarded by the row's xpAwarded flag, so at-least-once delivery from the
 * result queue stays exactly-once in effect). Non-ACCEPTED verdicts are
 * no-ops.
 */
import { ResultJobPayload, WorkerDeps } from './types';

export async function applyResultJob(
  payload: ResultJobPayload,
  deps: WorkerDeps
): Promise<{ xpAwarded: boolean }> {
  const { db, logger, config } = deps;

  const submission = await db.codingSubmission.findUnique({ where: { id: payload.submissionId } });
  if (!submission) {
    logger.warn({ submissionId: payload.submissionId }, 'Result apply: submission not found');
    return { xpAwarded: false };
  }
  if (submission.xpAwarded) {
    logger.info({ submissionId: payload.submissionId }, 'Result apply: XP already awarded — skipping');
    return { xpAwarded: true };
  }
  if (payload.verdict !== 'ACCEPTED') {
    return { xpAwarded: false };
  }

  await db.user.update({
    where: { id: payload.userId },
    data: { xp: { increment: config.code.xpRewardSubmission } },
  });
  await db.codingSubmission.update({
    where: { id: payload.submissionId },
    data: { xpAwarded: true },
  });
  logger.info(
    { submissionId: payload.submissionId, xp: config.code.xpRewardSubmission },
    'XP reward applied'
  );
  return { xpAwarded: true };
}
