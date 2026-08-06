/**
 * Phase 5 — worker job payloads + shared dependency shape.
 *
 * All queue payloads and the WorkerDeps contract live here. Processors are
 * pure functions over WorkerDeps: the API side and worker/index.ts both call
 * them (inline fallback vs BullMQ worker), and tests inject fakes for every
 * dependency.
 */
import type { Logger } from '../config';
import type { AppConfig } from '../config';
import type { Judge0Provider } from '../integrations/judge0/types';
import type { QueueSet } from '../queues/factory';

export interface SubmissionJobPayload {
  submissionId: string;
  userId: string;
  problemId: string;
  code: string;
  language: string;
  requestId?: string;
  enqueuedAt?: number;
}

export interface EvaluationTestCase {
  id: string;
  inputData: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface EvaluationJobPayload {
  submissionId: string;
  userId: string;
  problemId: string;
  languageId: number;
  testcases: EvaluationTestCase[];
  code: string;
  language: string;
}

export interface ResultJobPayload {
  submissionId: string;
  userId: string;
  problemId: string;
  verdict: string;
}

export interface DlqJobPayload {
  submissionId: string;
  userId: string;
  problemId: string;
  originalQueue?: string;
  originalJobId?: string;
  errorMessage?: string;
}

export interface Judge0CaseResult {
  testcaseId: string;
  hidden: boolean;
  statusId: number;
  verdict: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  executionMs?: number;
  memoryKb?: number;
}

export interface SubmissionResult {
  verdict: string;
  passed: number;
  total: number;
  compileOutput?: string;
  stdout?: string;
  stderr?: string;
  executionMs?: number;
  memoryKb?: number;
  perTestCase: Judge0CaseResult[];
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  attempts: number;
}

export interface WorkerDeps {
  db: any;
  logger: Logger;
  config: AppConfig;
  judge0Provider: Judge0Provider;
  queues?: QueueSet;
  clock?: () => number;
}

export const TERMINAL_STATUSES: ReadonlySet<string> = new Set([
  'ACCEPTED',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'COMPILE_ERROR',
  'RUNTIME_ERROR',
  'PARTIAL',
  'SYSTEM_ERROR',
  'TIMED_OUT',
  'CANCELLED',
]);
