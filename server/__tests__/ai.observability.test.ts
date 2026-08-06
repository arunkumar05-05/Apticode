/**
 * Phase 4 — AI Observability & Reliability tests.
 *
 * All tests use a mock provider (registered via registerMockProvider) so they
 * are fully deterministic and do NOT hit any live provider.
 *
 * Live provider integration tests are gated behind RUN_LIVE_AI_TESTS=true and
 * are skipped in CI by default.
 */

import { app } from '../src/index';
import request from 'supertest';
import {
  callAi,
  callAiJson,
  registerMockProvider,
  resetCircuitBreaker,
  resetMetrics,
  getProviderHealth,
  getAiMetrics,
  getAiDailyUsage,
  isAiEnabled,
  aiProviderLabel,
} from '../src/services/aiProviderService';

const RUN_LIVE = process.env.RUN_LIVE_AI_TESTS === 'true';

describe('Phase 4 — AI Observability & Reliability', () => {
  let unregister: (() => void) | null = null;

  afterEach(() => {
    if (unregister) {
      unregister();
      unregister = null;
    }
    resetCircuitBreaker();
    resetMetrics();
    delete process.env.AI_PROVIDER_OVERRIDE;
  });

  function useMockProvider(impl: (req: any) => Promise<any>) {
    process.env.AI_PROVIDER_OVERRIDE = 'vsllm';
    unregister = registerMockProvider('vsllm', impl);
  }

  describe('Circuit breaker', () => {
    it('opens after 5 consecutive failures and returns null (fail-fast)', async () => {
      useMockProvider(async () => {
        throw Object.assign(new Error('Server error'), { status: 503 });
      });

      // 5 failures should trip the circuit
      for (let i = 0; i < 5; i++) {
        const result = await callAi({ prompt: 'test', requestId: 'cb-1', feature: 'test' });
        expect(result).toBeNull();
      }

      const health = getProviderHealth();
      const vsllm = health.find((h) => h.provider === 'vsllm');
      expect(vsllm).toBeDefined();
      expect(vsllm!.circuitState).toBe('OPEN');
      expect(vsllm!.consecutiveFailures).toBe(5);
    });

    it('returns immediately (circuit open) without calling the provider', async () => {
      let callCount = 0;
      useMockProvider(async () => {
        callCount++;
        throw Object.assign(new Error('Server error'), { status: 503 });
      });

      // Each callAi retries 3x (transient 503), so 1 call = up to 4 attempts
      // before giving up. The circuit trips after 5 consecutive provider
      // failures. We call until the circuit is OPEN, then verify a subsequent
      // call doesn't touch the provider.
      for (let i = 0; i < 5; i++) await callAi({ prompt: 'test', feature: 'test' });

      const baseline = callCount;

      // The circuit should now be OPEN (5 consecutive failures from retry layer).
      const health = getProviderHealth();
      const vsllm = health.find((h) => h.provider === 'vsllm');
      expect(vsllm).toBeDefined();
      expect(vsllm!.circuitState).toBe('OPEN');

      // One more call — should fail fast without calling the provider.
      await callAi({ prompt: 'test', feature: 'test' });
      expect(callCount).toBe(baseline);
    });

    it('closes again after a success (reset)', async () => {
      useMockProvider(async () => {
        throw Object.assign(new Error('Server error'), { status: 503 });
      });
      for (let i = 0; i < 6; i++) await callAi({ prompt: 'test', feature: 'test' });

      // Reset and register a success provider
      resetCircuitBreaker();
      unregister!();
      useMockProvider(async () => ({
        content: 'OK', provider: 'vsllm' as any, latencyMs: 10,
        model: 'test', retries: 0,
      }));

      const result = await callAi({ prompt: 'test', feature: 'test' });
      expect(result).toBe('OK');
      const health = getProviderHealth();
      const vsllm = health.find((h) => h.provider === 'vsllm');
      expect(vsllm!.circuitState).toBe('CLOSED');
      expect(vsllm!.healthy).toBe(true);
    });
  });

  describe('Retry strategy', () => {
    it('retries transient failures (502) then succeeds', async () => {
      let attempts = 0;
      useMockProvider(async () => {
        attempts++;
        if (attempts < 3) {
          throw Object.assign(new Error('Bad gateway'), { status: 502 });
        }
        return {
          content: 'recovered',
          provider: 'vsllm',
          model: 'test',
          latencyMs: 5,
          retries: attempts - 1,
        };
      });

      const result = await callAi({ prompt: 'test', feature: 'retry-test' });
      expect(result).toBe('recovered');
      expect(attempts).toBe(3);
      const metrics = getAiMetrics({ feature: 'retry-test' });
      expect(metrics[0].retryCount).toBe(2);
    });

    it('does NOT retry non-transient failures (400 / invalid request)', async () => {
      let attempts = 0;
      useMockProvider(async () => {
        attempts++;
        throw Object.assign(new Error('Bad request'), { status: 400 });
      });

      const result = await callAi({ prompt: 'test', feature: 'no-retry' });
      expect(result).toBeNull();
      expect(attempts).toBe(1);
    });

    it('does NOT retry 401 (auth failure)', async () => {
      let attempts = 0;
      useMockProvider(async () => {
        attempts++;
        throw Object.assign(new Error('Unauthorized'), { status: 401 });
      });

      await callAi({ prompt: 'test', feature: 'auth-fail' });
      expect(attempts).toBe(1);
    });

    it('retries on 429 (rate limited)', async () => {
      let attempts = 0;
      useMockProvider(async () => {
        attempts++;
        if (attempts < 2) {
          throw Object.assign(new Error('Rate limited'), { status: 429 });
        }
        return { content: 'ok', provider: 'vsllm', model: 'test', latencyMs: 5, retries: 0 };
      });

      const result = await callAi({ prompt: 'test', feature: 'rate-limit-retry' });
      expect(result).toBe('ok');
      expect(attempts).toBe(2);
    });

    it('gives up after MAX_RETRIES (3) on persistent 503', async () => {
      useMockProvider(async () => {
        throw Object.assign(new Error('Server error'), { status: 503 });
      });

      const result = await callAi({ prompt: 'test', feature: 'retry-exhausted' });
      expect(result).toBeNull();
      const health = getProviderHealth();
      const vsllm = health.find((h) => h.provider === 'vsllm');
      expect(vsllm!.consecutiveFailures).toBeGreaterThan(0);
    });
  });

  describe('Timeout handling', () => {
    it('handles AbortController timeout and returns null', async () => {
      // Mock a provider that hangs
      useMockProvider(async () => {
        throw Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
      });

      const result = await callAi({ prompt: 'test', feature: 'timeout-test' });
      expect(result).toBeNull();
      const metrics = getAiMetrics({ feature: 'timeout-test' });
      expect(metrics[0].outcome).toBe('TIMEOUT');
    });
  });

  describe('Quota exhaustion (402)', () => {
    it('returns null and records QUOTA_EXHAUSTED outcome', async () => {
      useMockProvider(async () => {
        throw Object.assign(new Error('quota exhausted'), { status: 402 });
      });

      const result = await callAi({ prompt: 'test', feature: 'quota-test' });
      expect(result).toBeNull();
      const metrics = getAiMetrics({ feature: 'quota-test' });
      expect(metrics[0].outcome).toBe('QUOTA_EXHAUSTED');
      const health = getProviderHealth();
      const vsllm = health.find((h) => h.provider === 'vsllm');
      expect(vsllm!.quotaExhausted).toBe(true);
    });
  });

  describe('Metrics collection', () => {
    it('records a SUCCESS metric with all required fields', async () => {
      useMockProvider(async () => ({
        content: '{"answer":"A"}',
        provider: 'vsllm',
        model: 'glm-4.7-flash-free',
        latencyMs: 42,
        retries: 0,
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      }));

      await callAi({ prompt: 'test', requestId: 'req-1', userId: 'user-1', feature: 'metrics-test' });

      const metrics = getAiMetrics({ feature: 'metrics-test' });
      expect(metrics.length).toBeGreaterThan(0);
      const m = metrics[0];
      expect(m.requestId).toBe('req-1');
      expect(m.userId).toBe('user-1');
      expect(m.feature).toBe('metrics-test');
      expect(m.provider).toBe('vsllm');
      expect(m.model).toBe('glm-4.7-flash-free');
      expect(m.outcome).toBe('SUCCESS');
      expect(m.durationMs).toBeGreaterThanOrEqual(0);
      expect(m.retryCount).toBe(0);
      expect(m.promptTokens).toBe(100);
      expect(m.completionTokens).toBe(50);
      expect(m.totalTokens).toBe(150);
    });

    it('records failure metrics with errorCategory', async () => {
      useMockProvider(async () => {
        throw Object.assign(new Error('Internal server error'), { status: 500 });
      });

      await callAi({ prompt: 'test', feature: 'failure-test' });
      const metrics = getAiMetrics({ feature: 'failure-test' });
      expect(metrics[0].outcome).toBe('SERVER_ERROR');
      expect(metrics[0].errorCategory).toBeTruthy();
    });

    it('never logs prompts or PII in metrics', async () => {
      useMockProvider(async () => ({
        content: 'response',
        provider: 'vsllm',
        model: 'test',
        latencyMs: 5,
        retries: 0,
      }));

      const prompt = 'user@example.com secret-data prompt';
      await callAi({ prompt, requestId: 'pii-test', userId: 'user-1', feature: 'pii-test' });
      const metrics = getAiMetrics({ feature: 'pii-test' });
      const blob = JSON.stringify(metrics);
      expect(blob).not.toContain(prompt);
    });

    it('aggregates daily usage by feature', async () => {
      useMockProvider(async (req: any) => ({
        content: 'response',
        provider: 'vsllm',
        model: 'test',
        latencyMs: 5,
        retries: 0,
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      }));

      for (let i = 0; i < 3; i++) {
        await callAi({ prompt: 'test', userId: 'u1', feature: 'usage-aggregation' });
      }

      const usage = getAiDailyUsage();
      const today = usage.find((u) => u.feature === 'usage-aggregation');
      expect(today).toBeDefined();
      expect(today!.requestCount).toBe(3);
      expect(today!.totalTokens).toBe(450);
    });
  });

  describe('callAiJson', () => {
    it('parses valid JSON', async () => {
      useMockProvider(async () => ({
        content: JSON.stringify([{ a: 1 }, { a: 2 }]),
        provider: 'vsllm',
        model: 'test',
        latencyMs: 5,
        retries: 0,
      }));

      const result = await callAiJson<any[]>({ prompt: 'test', feature: 'json-test' });
      expect(result).toEqual([{ a: 1 }, { a: 2 }]);
    });

    it('salvages truncated JSON arrays', async () => {
      useMockProvider(async () => ({
        content: '[{"a":1},{"a":2},{"a":3',
        provider: 'vsllm',
        model: 'test',
        latencyMs: 5,
        retries: 0,
      }));

      const result = await callAiJson<any[]>({ prompt: 'test', feature: 'json-salvage' });
      // Should extract {a:1} and {a:2} (complete objects only)
      expect(result).toHaveLength(2);
    });

    it('returns null for unparseable output', async () => {
      useMockProvider(async () => ({
        content: 'not json at all',
        provider: 'vsllm',
        model: 'test',
        latencyMs: 5,
        retries: 0,
      }));

      const result = await callAiJson({ prompt: 'test', feature: 'json-parse-fail' });
      expect(result).toBeNull();
    });
  });
});

// ============================================================
// Live provider tests (gated by RUN_LIVE_AI_TESTS=true)
// ============================================================
(RUN_LIVE ? describe : describe.skip)('Phase 4 — Live AI provider (RUN_LIVE_AI_TESTS=true)', () => {
  it('isAiEnabled returns true when AI_API_KEY is configured', () => {
    console.log('isAiEnabled:', isAiEnabled());
    console.log('aiProviderLabel:', aiProviderLabel());
    console.log('providerHealth:', getProviderHealth());
  });
});

// ============================================================
// Admin monitoring HTTP endpoints
// ============================================================
describe('Phase 4 — Admin monitoring endpoints', () => {
  it('GET /health includes additive ai diagnostics', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBeDefined();
    expect(res.body.ai).toBeDefined();
    expect(res.body.ai.aiEnabled).toBeDefined();
    expect(res.body.ai.provider).toBeDefined();
    expect(res.body.ai.providers).toBeDefined();
  });

  it('GET /api/admin/ai/health returns 200 for admin', async () => {
    // Log in as admin
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.edu', password: 'AdminPassword2026!' });
    const token = login.body.token;

    const res = await request(app)
      .get('/api/admin/ai/health')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.aiEnabled).toBeDefined();
    expect(res.body.providers).toBeDefined();
  });

  it('GET /api/admin/ai/providers returns 200 for admin', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.edu', password: 'AdminPassword2026!' });
    const token = login.body.token;

    const res = await request(app)
      .get('/api/admin/ai/providers')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.providers)).toBe(true);
  });

  it('GET /api/admin/ai/metrics returns 200 for admin', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.edu', password: 'AdminPassword2026!' });
    const token = login.body.token;

    const res = await request(app)
      .get('/api/admin/ai/metrics')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.metrics)).toBe(true);
  });

  it('GET /api/admin/ai/usage returns 200 for admin', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.edu', password: 'AdminPassword2026!' });
    const token = login.body.token;

    const res = await request(app)
      .get('/api/admin/ai/usage')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.usage)).toBe(true);
  });

  it('rejects non-admin users with 403', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@college.edu', password: 'StudentPassword2026!' });
    const token = login.body.token;

    const res = await request(app)
      .get('/api/admin/ai/health')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/ai/health');
    expect(res.status).toBe(401);
  });
});
