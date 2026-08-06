/**
 * Phase 5 — Judge0 HTTP provider.
 *
 * HTTP implementation of Judge0Provider (see types.ts). Talks to the Judge0
 * CE / Extra / self-hosted REST API:
 *   - Primary: POST /submissions/batch?wait=true (single round-trip)
 *   - Fallback (JUDGE0_POLL_MODE): POST for tokens, then GET until terminal
 *
 * Transient failures (network, timeout, 429, 5xx) raise TransientJudge0Error
 * so the queue layer can retry. Permanent failures (401/400/422) raise
 * FatalJudge0Error and are not retried. An unconfigured provider fails fast
 * with a clear TransientJudge0Error so dev/tests degrade to the inline
 * fallback path instead of hanging.
 */
import { config, logger } from '../../config';
import { resolveLanguageId } from './languageMap';
import {
  Judge0CaseOutcome,
  Judge0Language,
  Judge0Provider,
  Judge0SubmissionRequest,
  TransientJudge0Error,
  FatalJudge0Error,
} from './types';

// ============================================================
// Verdict mapping (Judge0 status id -> pipeline verdict)
// ============================================================

const STATUS_VERDICTS: Record<number, string> = {
  1: 'PENDING',
  2: 'PENDING',
  3: 'ACCEPTED',
  4: 'WRONG_ANSWER',
  5: 'TIME_LIMIT_EXCEEDED',
  6: 'COMPILE_ERROR',
  7: 'RUNTIME_ERROR',
  8: 'RUNTIME_ERROR',
  9: 'RUNTIME_ERROR',
  10: 'RUNTIME_ERROR',
  11: 'RUNTIME_ERROR',
  12: 'RUNTIME_ERROR',
  13: 'SYSTEM_ERROR',
  14: 'RUNTIME_ERROR',
};

export function mapStatusId(statusId: number): string {
  return STATUS_VERDICTS[statusId] || 'SYSTEM_ERROR';
}

// ============================================================
// Options / Provider
// ============================================================

export interface Judge0HttpProviderOptions {
  baseUrl: string;
  apiToken: string;
  authType: 'header' | 'bearer' | 'none';
  authHeader: string;
  apiVersion: string;
  fetchLanguages: boolean;
  languagesCacheTtlMs: number;
  waitTimeoutMs: number;
  pollMode: boolean;
  pollIntervalMs: number;
  pollMaxAttempts: number;
  enabled: boolean;
}

const FIELDS = 'token,status,stdout,stderr,compile_output,time,memory';
const TERMINAL_STATUS_IDS = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

export class Judge0HttpProvider implements Judge0Provider {
  readonly name = 'judge0';
  private readonly options: Judge0HttpProviderOptions;

  constructor(options: Partial<Judge0HttpProviderOptions>) {
    const o = config.judge0;
    this.options = {
      baseUrl: options.baseUrl ?? o.apiUrl,
      apiToken: options.apiToken ?? o.apiToken,
      authType: options.authType ?? o.authType,
      authHeader: options.authHeader ?? o.authHeader,
      apiVersion: options.apiVersion ?? o.apiVersion,
      fetchLanguages: options.fetchLanguages ?? o.fetchLanguages,
      languagesCacheTtlMs: options.languagesCacheTtlMs ?? o.languagesCacheTtlMs,
      waitTimeoutMs: options.waitTimeoutMs ?? o.waitTimeoutMs,
      pollMode: options.pollMode ?? o.pollMode,
      pollIntervalMs: options.pollIntervalMs ?? o.pollIntervalMs,
      pollMaxAttempts: options.pollMaxAttempts ?? o.pollMaxAttempts,
      enabled: options.enabled ?? o.enabled,
    };
  }

  async submitBatch(
    reqs: Judge0SubmissionRequest[],
    opts?: { timeoutMs?: number; signal?: AbortSignal }
  ): Promise<Judge0CaseOutcome[]> {
    this.assertConfigured();
    if (reqs.length === 0) return [];

    const controller = new AbortController();
    const external = opts?.signal;
    if (external) {
      if (external.aborted) controller.abort();
      else external.addEventListener('abort', () => controller.abort(), { once: true });
    }
    const timeoutMs = opts?.timeoutMs ?? this.options.waitTimeoutMs;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      if (this.options.pollMode) {
        return await this.submitWithPolling(reqs, controller.signal);
      }
      return await this.submitAndWait(reqs, controller.signal);
    } finally {
      clearTimeout(timer);
      if (external) external.removeEventListener('abort', () => controller.abort());
    }
  }

  async resolveLanguageId(slug: string, version?: string): Promise<number> {
    if (this.options.enabled && this.options.fetchLanguages) {
      return resolveLanguageId(slug, version, {
        fetchLanguages: true,
        cacheTtlMs: this.options.languagesCacheTtlMs,
        fetcher: async (s) => this.languageIdForSlug(s),
      });
    }
    return resolveLanguageId(slug, version);
  }

  async getLanguages(): Promise<Judge0Language[]> {
    this.assertConfigured();
    const data = await this.request<any[]>('/languages', { method: 'GET' });
    return data.map((l: any) => ({ id: Number(l.id), name: String(l.name || '') })).filter((l) => l.id > 0);
  }

  // ============================================================
  // Internals
  // ============================================================

  private assertConfigured(): void {
    if (!this.options.enabled || !this.options.baseUrl) {
      throw new TransientJudge0Error(
        'Judge0 is not configured: set JUDGE0_API_URL and JUDGE0_API_TOKEN (or JUDGE0_AUTH_TOKEN) to enable remote code execution'
      );
    }
  }

  private authHeaders(): Record<string, string> {
    if (this.options.authType === 'none' || !this.options.apiToken) return {};
    if (this.options.authType === 'bearer') return { Authorization: `Bearer ${this.options.apiToken}` };
    return { [this.options.authHeader]: this.options.apiToken };
  }

  private baseUrl(): string {
    return this.options.baseUrl.replace(/\/+$/, '');
  }

  private buildBody(reqs: Judge0SubmissionRequest[]): any {
    return {
      submissions: reqs.map((r) => ({
        source_code: r.sourceCode,
        language_id: r.languageId,
        stdin: r.stdin ?? '',
        expected_output: r.expectedOutput ?? undefined,
        cpu_time_limit: r.cpuTimeLimitSec,
        memory_limit: r.memoryLimitKb,
      })),
    };
  }

  private toOutcome(raw: any): Judge0CaseOutcome {
    const statusId = Number(raw?.status?.id ?? 1);
    return {
      token: String(raw?.token ?? ''),
      statusId,
      verdict: mapStatusId(statusId),
      stdout: raw?.stdout != null && raw.stdout !== '' ? String(raw.stdout) : undefined,
      stderr: raw?.stderr != null && raw.stderr !== '' ? String(raw.stderr) : undefined,
      compileOutput: raw?.compile_output != null && raw.compile_output !== '' ? String(raw.compile_output) : undefined,
      timeSec: raw?.time != null ? Number(raw.time) : undefined,
      memoryKb: raw?.memory != null ? Number(raw.memory) : undefined,
    };
  }

  private async submitAndWait(reqs: Judge0SubmissionRequest[], signal: AbortSignal): Promise<Judge0CaseOutcome[]> {
    const url = `${this.baseUrl()}/submissions/batch?wait=true&fields=${FIELDS}`;
    const data = await this.request<any[]>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(this.buildBody(reqs)),
      signal,
    });
    return Array.isArray(data) ? data.map((raw) => this.toOutcome(raw)) : [];
  }

  private async submitWithPolling(reqs: Judge0SubmissionRequest[], signal: AbortSignal): Promise<Judge0CaseOutcome[]> {
    const postUrl = `${this.baseUrl()}/submissions/batch`;
    const created = await this.request<any[]>(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(this.buildBody(reqs)),
      signal,
    });
    const tokens = (Array.isArray(created) ? created : []).map((s: any) => String(s?.token)).filter(Boolean);
    if (tokens.length === 0) {
      throw new TransientJudge0Error('Judge0 batch submission returned no tokens');
    }

    for (let attempt = 1; attempt <= this.options.pollMaxAttempts; attempt++) {
      const url = `${this.baseUrl()}/submissions/batch?tokens=${tokens.join(',')}&fields=${FIELDS}`;
      const data = await this.request<any[]>(url, {
        method: 'GET',
        headers: this.authHeaders(),
        signal,
      });
      const outcomes = (Array.isArray(data) ? data : []).map((raw) => this.toOutcome(raw));
      if (outcomes.length > 0 && outcomes.every((o) => TERMINAL_STATUS_IDS.has(o.statusId))) {
        return outcomes;
      }
      if (attempt < this.options.pollMaxAttempts) {
        await new Promise((r) => setTimeout(r, this.options.pollIntervalMs));
      }
    }
    throw new TransientJudge0Error(
      `Judge0 polling timed out after ${this.options.pollMaxAttempts} attempts (tokens: ${tokens.length})`
    );
  }

  private async languageIdForSlug(slug: string): Promise<number | null> {
    const languages = await this.getLanguages();
    const s = slug.toLowerCase();
    const byWord = languages.find((l) =>
      l.name.toLowerCase().split(/[^a-z0-9+#.]+/i).includes(s)
    );
    if (byWord) return byWord.id;
    const byContains = languages.find((l) => l.name.toLowerCase().includes(s));
    return byContains ? byContains.id : null;
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new TransientJudge0Error(
          `Judge0 request timed out after ${this.options.waitTimeoutMs}ms`,
          undefined
        );
      }
      throw new TransientJudge0Error(`Judge0 request failed: ${err?.message || 'network error'}`);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const reason = text.slice(0, 240);
      if (res.status === 401 || res.status === 400 || res.status === 422) {
        throw new FatalJudge0Error(`Judge0 HTTP ${res.status}: ${reason}`, res.status);
      }
      throw new TransientJudge0Error(`Judge0 HTTP ${res.status}: ${reason}`, res.status);
    }
    return (await res.json()) as T;
  }
}

// ============================================================
// Registry + factory (test seams mirroring aiProviderService)
// ============================================================

export const judge0Registry: Map<string, Judge0Provider> = new Map();

export function registerMockJudge0(name: string, provider: Judge0Provider): () => void {
  const prev = judge0Registry.get(name);
  judge0Registry.set(name, provider);
  return () => {
    if (prev) judge0Registry.set(name, prev);
    else judge0Registry.delete(name);
  };
}

export function createJudge0Provider(): Judge0Provider {
  // Read the override from process.env directly: config is memoised at first
  // access (cfg() caches _cfg), so a runtime env var set by tests/builder is
  // invisible through config.judge0.providerOverride. This mirrors Phase 4's
  // selectProvider() which also reads AI_PROVIDER_OVERRIDE directly.
  const override = process.env.JUDGE0_PROVIDER_OVERRIDE;
  if (override && judge0Registry.has(override)) {
    logger.info({ provider: override }, 'Using registered Judge0 provider override');
    return judge0Registry.get(override)!;
  }
  return new Judge0HttpProvider({});
}
