/**
 * Phase 5 — Judge0 provider contract.
 *
 * The worker depends only on this interface; the HTTP implementation lives
 * in provider.ts and tests inject fakes via the judge0Registry (see
 * provider.ts). Error classes split retryable failures (TransientJudge0Error)
 * from permanent ones (FatalJudge0Error).
 */

export interface Judge0SubmissionRequest {
  sourceCode: string;
  languageId: number;
  stdin?: string;
  expectedOutput?: string;
  cpuTimeLimitSec?: number;
  memoryLimitKb?: number;
}

export interface Judge0CaseOutcome {
  token: string;
  statusId: number;
  verdict: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  timeSec?: number;
  memoryKb?: number;
}

export interface Judge0SubmitBatchOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface Judge0Language {
  id: number;
  name: string;
}

export interface Judge0Provider {
  readonly name: string;
  submitBatch(reqs: Judge0SubmissionRequest[], opts?: Judge0SubmitBatchOptions): Promise<Judge0CaseOutcome[]>;
  resolveLanguageId(slug: string, version?: string): Promise<number>;
  getLanguages(): Promise<Judge0Language[]>;
}

export class TransientJudge0Error extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'TransientJudge0Error';
    this.status = status;
  }
}

export class FatalJudge0Error extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'FatalJudge0Error';
    this.status = status;
  }
}

export class JobTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JobTimeoutError';
  }
}
