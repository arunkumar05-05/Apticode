/**
 * AptiCode server entry point.
 *
 * Bootstrap sequence (Phase 1 infra):
 *   1. Load + validate environment via config.
 *   2. Build the Express app (factory in app.ts).
 *   3. Initialize the database (pg -> sqlite -> memory fallback chain).
 *   4. Start HTTP server + graceful shutdown (SIGTERM/SIGINT) ONLY when
 *      executed directly (NOT when imported by Jest/supertest).
 *
 * The `app` export is kept at this module path for backward compatibility
 * with existing tests (`import { app } from '../src/index'`).
 */
import http from 'http';
import dotenv from 'dotenv';
import express from 'express';
import { createApp } from './app';
import { logger } from './config/logger';
import { config } from './config';
import { initDatabase, getActiveDriver } from './prisma/db';

// Load .env BEFORE config validation (config reads process.env).
dotenv.config();

export const app = createApp();
export type ExpressHandler = http.RequestListener;

// Expose for health/controller probes in-process.
export { createApp };

// Boot the real HTTP server only when run directly (not under Jest).
const isMain = require.main?.filename?.endsWith('index.ts') || require.main?.filename?.endsWith('index.js');

async function boot() {
  logger.info(
    {
      env: config.env,
      port: config.port,
      version: config.appVersion,
      aiEnabled: config.ai.enabled,
      redisConfigured: Boolean(config.redis.url),
    },
    'AptiCode server starting'
  );

  try {
    await initDatabase();
    logger.info({ database: getActiveDriver() }, 'Database initialized');
  } catch (err: any) {
    logger.error({ err: { message: err.message } }, 'Database init failed — continuing in memory mode');
  }

  const server = http.createServer(app);

  server.listen(config.port, config.host, () => {
    logger.info(`Server listening on ${config.host}:${config.port} (env=${config.env})`);
  });

  // Graceful shutdown for Render/Railway SIGTERM.
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal} — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 30_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.error({ err: err }, 'Uncaught exception');
    process.exit(1);
  });
}

// Catch startup errors (only relevant when run as main).
if (isMain) {
  void boot().catch((err) => {
    logger.error({ err: err }, 'Fatal startup error');
    process.exit(1);
  });
}
