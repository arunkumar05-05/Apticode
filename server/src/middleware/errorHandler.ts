import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Centralized error handler.
 *
 * Response shape is unchanged from the original implementation
 * (`{ status, message, stack? }`) so existing API consumers stay compatible.
 * Adds structured request-correlated logging via pino and a safe no-leak
 * mode in production (stack omitted in prod responses).
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  // @ts-ignore — req.id set by requestId middleware
  const reqId = (req as any).id;
  const statusCode = err?.status || err?.statusCode || err?.statusCode === 0 ? err.status || err.statusCode : 500;
  const safeStatus = Number.isInteger(statusCode) && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
  const message = err?.message || 'Internal Server Error';

  // Structured log: correlate with request id; never log raw tokens.
  logger.error(
    {
      err: {
        message: message,
        code: err?.code,
        statusCode: safeStatus,
      },
      req: {
        id: reqId,
        method: req.method,
        url: req.originalUrl || req.url,
      },
    },
    `request failed: ${message}`
  );

  // Never throw from the error handler itself.
  try {
    if (res.headersSent) {
      return;
    }
    res.status(safeStatus).json({
      status: 'error',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err?.stack }),
    });
  } catch (e) {
    logger.error({ err: e }, 'error handler failed to respond');
  }
}
