/**
 * Phase 5 — realtime submission stream (SSE).
 *
 * GET /api/coding/submissions/stream keeps a Server-Sent Events connection
 * open and forwards submission-status updates published by the grading
 * workers. Auth comes from the shared authMiddleware (cookie / bearer —
 * never a ?token= query param, because request logging captures full URLs).
 */
import type { Response } from 'express';
import { logger } from '../config';
import { registerStreamClient } from '../events/submissionEvents';
import type { AuthenticatedRequest } from '../middleware/auth';
import type { SubmissionEvent } from '../events/submissionEvents';

const MAX_SUBMISSION_ID_LENGTH = 64;

export function formatSseEvent(evt: SubmissionEvent): string {
  return `event: submission\ndata: ${JSON.stringify(evt)}\n\n`;
}

export function streamSubmissions(req: AuthenticatedRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ status: 'fail', message: 'Unauthorized' });
    return;
  }

  const rawSubmissionId = typeof req.query.submissionId === 'string' ? req.query.submissionId.trim() : '';
  const submissionId = rawSubmissionId.length > 0 && rawSubmissionId.length <= MAX_SUBMISSION_ID_LENGTH ? rawSubmissionId : undefined;
  if (rawSubmissionId && !submissionId) {
    logger.warn({ userId: user.userId, submissionId: rawSubmissionId }, 'Invalid submissionId on stream request');
  }

  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write(': ping\n\n');

  const clientId = registerStreamClient({
    userId: user.userId,
    submissionId,
    res,
  });
  logger.info({ userId: user.userId, submissionId, clientId }, 'Submission stream opened');

  req.on('close', () => {
    res.end();
  });
}
