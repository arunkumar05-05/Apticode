/**
 * Security headers + compression setup middleware.
 *
 * - Helmet sets secure headers (CSP, HSTS, X-Frame-Options, etc.) in
 *   production; relaxed in dev to avoid interfering with hot reload.
 * - Compression is enabled everywhere; small payloads are skipped via the
 *   threshold option.
 *
 * Applied early in app.ts, before routes.
 */
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { config } from '../config';

export function securityMiddleware(_req: Request, res: Response, next: NextFunction) {
  void _req;
  void res;
  void next;
}

// Helmet options: tighten in prod, stay permissive in dev (fonts/icons, HMR).
export function helmetMiddleware() {
  if (config.isDev) {
    return helmet({
      contentSecurityPolicy: false, // allow inline Vite HMR / dev scripts
    });
  }
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://vsllm.com', 'https://generativelanguage.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // needed for some 3D / font assets
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  });
}

// Compression: skip tiny payloads and already-compressed content types.
export function compressionMiddleware() {
  return compression({ threshold: 1024, level: 6 });
}
