/**
 * Phase 4 — Admin monitoring endpoints for AI observability.
 *
 * All endpoints are protected by requireRole(['ADMIN']).
 * Endpoints do not accept user input that gets forwarded to the provider —
 * they only read local metrics / health state.
 */

import { Request, Response } from 'express';
import {
  getProviderHealth,
  getAiMetrics as getAiMetricsFromCache,
  getAiDailyUsage,
  isAiEnabled,
  aiProviderLabel,
} from '../services/aiProviderService';
import { db } from '../prisma/db';
import { logger } from '../config/logger';

export async function getAiMetrics(req: Request, res: Response) {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const since = req.query.since ? new Date(req.query.since as string) : undefined;
    const features = getAiMetricsFromCache({ limit, since });
    res.json({ status: 'success', metrics: features });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch AI metrics');
    res.status(500).json({ status: 'error', message: 'Failed to fetch AI metrics' });
  }
}

export async function getAiProviders(req: Request, res: Response) {
  try {
    const health = getProviderHealth();
    res.json({ status: 'success', providers: health });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch AI provider health');
    res.status(500).json({ status: 'error', message: 'Failed to fetch provider health' });
  }
}

export async function getAiHealth(req: Request, res: Response) {
  try {
    const health = getProviderHealth();
    const enabled = isAiEnabled();
    const provider = aiProviderLabel();

    // Aggregate circuit-breaker state from the in-memory map.
    const summary = {
      aiEnabled: enabled,
      provider,
      providers: health,
    };

    const anyOpen = health.some((p) => p.circuitState === 'OPEN');
    const anyUnhealthy = health.some((p) => !p.healthy);

    res.json({
      status: 'success',
      aiEnabled: enabled,
      providers: summary.providers,
      overallHealthy: !anyOpen && !anyUnhealthy,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch AI health');
    res.status(500).json({ status: 'error', message: 'Failed to fetch AI health' });
  }
}

export async function getAiUsage(req: Request, res: Response) {
  try {
    const since = req.query.since ? new Date(req.query.since as string) : undefined;
    let usage = getAiDailyUsage();
    if (since) usage = usage.filter((u) => new Date(u.date) >= since);
    res.json({ status: 'success', usage });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch AI usage');
    res.status(500).json({ status: 'error', message: 'Failed to fetch AI usage' });
  }
}

/**
 * Optionally persist metrics to the DB for long-term retention.
 * In-memory circular buffer (500 entries) is the primary store; this is a
 * best-effort flush endpoint for operators who want DB-backed retention.
 */
export async function flushAiMetrics(req: Request, res: Response) {
  try {
    // Metrics are flushed automatically every 30s; this endpoint
    // triggers an immediate flush from the in-memory buffer.
    const { flushMetrics } = await import('../services/aiProviderService');
    await flushMetrics();
    res.json({ status: 'success', message: 'AI metrics flushed' });
  } catch (err) {
    logger.error({ err }, 'Failed to flush AI metrics');
    res.status(500).json({ status: 'error', message: 'Failed to flush metrics' });
  }
}
