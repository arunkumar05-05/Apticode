import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'fail', message: 'Access token missing or malformed.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({ status: 'fail', message: 'Invalid or expired access token.' });
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    console.error('[Auth Middleware] Unexpected error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error during authentication.' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ status: 'fail', message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'fail', message: 'Insufficient permissions.' });
    }

    next();
  };
}