/**
 * Phase 4 — Backward-compatible re-export layer.
 *
 * The AI provider abstraction now lives in src/services/aiProviderService.ts.
 * Existing services import { callAi, callAiJson, isAiEnabled, aiProviderLabel }
 * from ../utils/ai — those re-export the new observability-enabled implementations
 * so the call signatures and behavior remain identical (no service changes needed).
 *
 * All AI calls now flow through:
 *   config-driven provider selection → circuit breaker → retry w/ backoff+jitter
 *   → structured metrics + pino logging (request-id correlated, no PII).
 */
export { callAi, callAiJson, isAiEnabled, aiProviderLabel } from '../services/aiProviderService';
export type { AiRequest, AiResponse, AiProviderType, AiMetricsRecord } from '../services/aiProviderService';
