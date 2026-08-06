/**
 * Phase 5 — queue & job names, default job options.
 *
 * All queue/job identifiers live here so consumers, workers, admin routes,
 * and tests share one source of truth. Option getters read from config so
 * attempts/backoff stay env-tunable while defaults match the spec.
 */
import { config } from '../config';

export const QUEUE_NAMES = {
  submission: 'code-submission',
  evaluation: 'code-evaluation',
  result: 'result-processing',
  submissionDlq: 'code-submission-dlq',
  evaluationDlq: 'code-evaluation-dlq',
  resultDlq: 'result-processing-dlq',
} as const;

export const JOB_NAMES = {
  submission: 'submission.run',
  evaluation: 'evaluation.run',
  result: 'result.apply',
  dlq: 'dlq.retain',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const QUEUE_OPTIONS = {
  get submission() {
    return {
      attempts: config.queue.submissionAttempts,
      backoff: { type: 'exponential' as const, delay: config.queue.submissionBackoffMs },
      removeOnComplete: { age: 86_400, count: 1_000 },
      removeOnFail: { age: 604_800 },
    };
  },
  get evaluation() {
    return {
      attempts: config.queue.submissionAttempts,
      backoff: { type: 'exponential' as const, delay: config.queue.submissionBackoffMs },
      removeOnComplete: { age: 86_400, count: 1_000 },
      removeOnFail: { age: 604_800 },
    };
  },
  get result() {
    return {
      attempts: config.queue.resultAttempts,
      backoff: { type: 'exponential' as const, delay: 1_000 },
      removeOnComplete: { age: 86_400, count: 1_000 },
      removeOnFail: { age: 604_800 },
    };
  },
  get dlq() {
    return {
      removeOnComplete: false,
      removeOnFail: false,
    };
  },
} as const;
