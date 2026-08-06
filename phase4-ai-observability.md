# Phase 4 — AI Observability & Reliability (v0.11.0-phase4)

Turns the AI layer into a production-grade, observable service. **Strictly additive**:
no AI API contract changed, no frontend change, all existing call sites keep working
via backward-compatible exports.

---

## 1. What was built

| Requirement | Where | How |
|---|---|---|
| AI metrics (per request) | `src/services/aiProviderService.ts` | Ring buffer (max 500 in-flight) → async flush to `AiMetrics` table every 30s (timer is `unref()`'d) |
| Token & cost tracking | same | Prompt/completion/total tokens + `estimatedCostUSD` from per-provider rate table |
| Provider health | same | In-memory `providerHealth` map: lastOk, consecutiveFailures, circuit state, quotaExhausted |
| Retry strategy | same | Transient-only retry — {429, 500, 502, 503, 504} + network + timeout. `MAX_RETRIES=3`, exponential backoff with jitter (`BASE_BACKOFF_MS=100`) |
| Circuit breaker | same | Per-provider; opens after 5 consecutive failures, 60s reset timeout, HALF_OPEN probe, fail-fast (`CIRCUIT_OPEN`) while open |
| Provider abstraction | same | `providerRegistry` — vsllm / gemini / sandbox; selectable via `config.ai.provider` or `AI_PROVIDER_OVERRIDE` env; sandbox is a deterministic fallback so features never hard-fail |
| Request logging | same | Structured (pino) logs: `feature`, `provider`, `requestId`, `userId`, `attempt`, `delayMs`, `durationMs`, `tokens`, `costUSD`, `outcome` |
| Health endpoint | `src/app.ts` | `/health` gains additive `ai: { aiEnabled, provider, providers }` block — never degrades or blocks the health response |
| Monitoring API | `src/controllers/aiMonitoringController.ts` + `src/routes/api.ts` | Admin-only (`requireRole(['ADMIN'])`) endpoints, see §2 |
| Alerts | structured logs | Every failure is an `outcome`-tagged log line (`QUOTA_EXHAUSTED`, `CIRCUIT_OPEN`, `TIMEOUT`, `SERVER_ERROR`…) — hook your log pipeline's alerting on these |
| Testing | `__tests__/ai.observability.test.ts` (25 tests) | Circuit breaker, retry, timeout, quota, metrics, JSON salvage, auth enforcement, health block |
| Performance | design | Metrics are fire-and-forget; AI calls never await DB writes; breaker/retry add zero overhead in the happy path |

## 2. Monitoring endpoints (admin)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/ai/metrics` | Recent metrics (buffered), latest persisted count |
| GET | `/api/admin/ai/providers` | Provider registry: name, model, healthy |
| GET | `/api/admin/ai/health` | Per-provider health: circuit state, consecutive failures, lastOk, quota flag |
| GET | `/api/admin/ai/usage` | Daily aggregation: calls, tokens, estimated cost, by outcome |
| POST | `/api/admin/ai/metrics/flush` | Force-persist buffered metrics now |

All behind `authMiddleware` + `requireRole(['ADMIN'])` (401 no-bearer / 403 non-admin verified by tests).

## 3. Metrics model (`AiMetrics`)

`id, feature, provider, model, requestId, userId, outcome, statusCode, durationMs,
attempts, promptTokens, completionTokens, totalTokens, estimatedCostUSD,
requestHash, errorMessage(≤400 chars), createdAt`.

`AiOutcome` enum (PG): `SUCCESS, SERVER_ERROR, TIMEOUT, QUOTA_EXHAUSTED, CIRCUIT_OPEN, RATE_LIMITED, INVALID_RESPONSE, PARSE_FAILURE, NETWORK_ERROR, DISABLED`.
SQLite schema uses a `String @default("SUCCESS")` field (SQLite has no enums).

PII discipline: raw prompts/responses are **never** logged or stored — only a `requestHash`.

## 4. Provider layer

- `callAi` / `callAiJson` (unchanged signatures — `src/utils/ai.ts` is now a re-export shim).
- JSON salvage preserved: exact parse → balanced-object extraction → single-object regex; null on total failure (callers' existing sandbox fallback still applies).
- Circuit breaker counts **provider-level** outcomes after internal retries are exhausted.
- 402 → `QUOTA_EXHAUSTED` + `providerHealth[provider].quotaExhausted = true` (surfaces vsllm's current quota limit as observable state instead of a silent flake).
- Test injection points exported: `registerMockProvider`, `resetCircuitBreaker`, `resetMetrics`.

## 5. Rate limiting

`aiLimiter` (20 req/min, was dead code) now mounted per-route on the 5 AI-generating
routes: `/api/ai/coach`, `/api/mcqs/generate`, `/api/resume/audit`,
`/api/interview/start`, `/api/communication/eval`.

## 6. Files changed

- `server/src/services/aiProviderService.ts` — **new**, core (registry, breaker, retry, metrics, health, callAi/callAiJson)
- `server/src/utils/ai.ts` — re-export shim (backward compatible)
- `server/src/controllers/aiMonitoringController.ts` — **new**, admin endpoints
- `server/src/routes/api.ts` — admin AI routes + aiLimiter on AI routes
- `server/src/app.ts` — `/health` `ai` block
- `server/prisma/schema.prisma` + `server/prisma/schema.sqlite.prisma` — `AiMetrics`, `AiProviderHealth`
- `server/src/prisma/memoryStore.ts` — in-memory repos for tests
- `server/__tests__/ai.observability.test.ts` — **new**, 25 tests
- `server/__tests__/ai.features.test.ts` — live tests gated behind `RUN_LIVE_AI_TESTS=true` (`describe.skip` when off)

## 7. Verification

- `npx jest` → **6 suites passed, 1 skipped (live); 53 passed, 5 skipped, 58 total**
- `npx tsc --noEmit` clean; `npm run build` clean
- `prisma validate` clean for both PG and SQLite schemas
- `prisma db push` (SQLite) → schema in sync (17ms)
- Live tests skipped by default; run with `RUN_LIVE_AI_TESTS=true` to exercise the real provider

## 8. Ops notes & known limits

- **vsllm currently returns HTTP 402 (quota exhausted)** — pre-existing external limit,
  now visible as `QUOTA_EXHAUSTED` in metrics/logs and via `/api/admin/ai/health`.
- Metrics are best-effort: DB failures are logged and buffered records re-queued (up to cap).
- Cost is estimated from a static per-provider rate table — keep it in sync with billing.
- `AiProviderHealth` table exists for future cross-restart health persistence; current circuit
  state is in-memory per process (fine for single-instance; multi-instance would need Redis).
