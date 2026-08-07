/**
 * Express application factory (Phase 1 infra).
 *
 * Assembles the app with production-ready middleware:
 *   helmet (security headers) · compression · requestId · rate limiting ·
 *   body parsing · CORS (env-driven) · request logging · API router ·
 *   health check w/ DB ping · centralized error handler.
 *
 * Existing auth + API routes are wired exactly as before. Backward compatible.
 */
import express, { Express } from 'express';
import cors from 'cors';
import apiRouter from './routes/api';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import { helmetMiddleware, compressionMiddleware } from './middleware/securityHeaders';
import { generalLimiter, authLimiter } from './middleware/rateLimiter';
import { config, logger } from './config';
import { dispatchSubmissionEvent, subscribeSubmissionEvents } from './events/submissionEvents';

export function createApp(): Express {
  const app: Express = express();

  // --- Body parsing (limit configurable) ---
  app.use(express.json({ limit: config.security.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.security.bodyLimit }));

  // --- Security headers + compression ---
  app.use(helmetMiddleware());
  app.use(compressionMiddleware());

  // --- Trust proxy (for correct IPs behind Railway/Render proxies) ---
  if (config.security.trustProxy) {
    app.set('trust proxy', 1);
  }

  // --- Request ID (log correlation) ---
  app.use(requestId());

  // --- CORS (env-driven allow-list) ---
  const allowedOrigins = buildAllowedOrigins();
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow non-browser tools
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  // --- Request logging (skip in tests unless explicitly enabled) ---
  if (config.security.requestLogging && process.env.NODE_ENV !== 'test') {
    app.use((req, _res, next) => {
      // @ts-ignore
      const id = req.id || '-';
      logger.info({ method: req.method, url: req.originalUrl || req.url, reqId: id }, 'request');
      next();
    });
  }

  // --- Rate limiting ---
  app.use('/api/auth', authLimiter);
  app.use('/api', generalLimiter);

  // --- API routes (existing auth + API, untouched) ---
  app.use('/api', apiRouter);

  // --- Realtime submission events: wire the SSE fan-out dispatcher ---
  // Lazy Redis subscriber — no I/O at boot, never throws; idempotent across
  // repeated createApp() calls (tests) since the subscriber is a singleton.
  void subscribeSubmissionEvents(dispatchSubmissionEvent);

  // --- Health check (now includes DB liveness) ---
  app.get('/health', healthHandler);

  // --- 404 handler ---
  app.use(notFoundHandler);

  // --- Centralized error handler (must be last) ---
  app.use(errorHandler);

  return app;
}

function buildAllowedOrigins(): string[] {
  const explicit = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const defaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:5001',
    'https://apticode.vercel.app',
  ];
  const out = [...defaults, ...explicit];
  // Allow *.vercel.app and anything containing 'apticode' if requested.
  if (process.env.ALLOW_ALL_APTCODE === 'true') {
    return ['*'];
  }
  return out;
}

async function healthHandler(_req: express.Request, res: express.Response) {
  // DB liveness + provider + version (additive fields; existing ones preserved).
  let dbInfo: { provider: string; reachable: boolean; version: string; driver: string } | null = null;
  try {
    const { dbHealth } = await import('./prisma/db');
    dbInfo = await dbHealth();
  } catch (e) {
    logger.warn({ err: e }, 'health DB probe failed');
  }

  // Migration status: compare `_prisma_migrations` (applied) vs expected.
  let migrationStatus: { lastApplied?: string; appliedCount?: number } = {};
  try {
    const { migrationStatusCheck } = await import('./prisma/migrate');
    migrationStatus = await migrationStatusCheck();
  } catch (e) {
    logger.warn({ err: e }, 'health migration probe failed');
  }

  // Phase 4 — AI diagnostics (additive, never blocks health response).
  let aiInfo: Record<string, unknown> = {};
  try {
    const { isAiEnabled, aiProviderLabel, getProviderHealth } = await import('./services/aiProviderService');
    aiInfo = {
      aiEnabled: isAiEnabled(),
      provider: aiProviderLabel(),
      providers: getProviderHealth(),
    };
  } catch (e) {
    logger.warn({ err: e }, 'health AI probe failed');
  }

  const reachable = dbInfo ? dbInfo.reachable : false;
  const status = reachable ? 'UP' : 'DEGRADED';
  // Process metrics (additive; existing fields preserved).
  const mem = process.memoryUsage();
  res.status(reachable ? 200 : 503).json({
    status,                                   // preserved
    timestamp: new Date().toISOString(),      // preserved
    version: config.appVersion,               // preserved
    database: dbInfo ? dbInfo.driver : 'down',            // preserved
    databaseReachable: reachable,             // preserved
    // -- new additive fields --
    databaseProvider: dbInfo ? dbInfo.provider : 'unknown',
    databaseVersion: dbInfo ? dbInfo.version : 'unknown',
    migration: migrationStatus,
    env: config.env,
    uptime: process.uptime(),
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
    },
    // -- Phase 4: AI diagnostics (additive) --
    ai: aiInfo,
  });
}

function notFoundHandler(_req: express.Request, res: express.Response) {
  res.status(404).json({ status: 'fail', message: 'Route not found' });
}
