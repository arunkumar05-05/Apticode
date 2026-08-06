/**
 * Authentication middleware.
 *
 * - Verifies JWT access tokens (backward-compatible w/ pre-issuer tokens).
 * - Correlates every auth failure with the request id (req.id) for tracing.
 * - Standardized 401/403 responses; contracts are unchanged from the
 *   original implementation (same shape: { status, message }).
 */
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService';
import { logger } from '../config/logger';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

function clientIp(req: Request): string | undefined {
  const h = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
  if (typeof h === 'string') return h.split(',')[0].trim();
  return undefined;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // @ts-ignore — req.id from requestId middleware
      logger.info({ reqId: req.id, url: req.originalUrl, reason: 'no-bearer' }, 'auth:unauthenticated');
      return res.status(401).json({ status: 'fail', message: 'Access token missing or malformed.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      // @ts-ignore
      logger.info({ reqId: req.id, url: req.originalUrl, ip: clientIp(req), reason: 'invalid-token' }, 'auth:unauthenticated');
      return res.status(401).json({ status: 'fail', message: 'Invalid or expired access token.' });
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    logger.error({ err: { message: err.message }, url: req.originalUrl }, 'auth middleware error');
    return res.status(500).json({ status: 'error', message: 'Internal server error during authentication.' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ status: 'fail', message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      // @ts-ignore
      logger.info({ reqId: req.id, userId: req.user.userId, role: req.user.role, required: roles }, 'auth:forbidden');
      return res.status(403).json({ status: 'fail', message: 'Insufficient permissions.' });
    }
    next();
  };
}
