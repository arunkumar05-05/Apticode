/**
 * Authentication audit log.
 *
 * Writes immutable event records to the AuthAuditLog table. NEVER stores
 * passwords, JWTs, or raw refresh/reset/verification tokens — only the event
 * type, the actor (id + requesting IP + User-Agent), and a free-form
 * `detail` string that callers are responsible for keeping sensitive-free.
 */
import { db } from '../prisma/db';
import { logger } from '../config/logger';

export type AuthEvent =
  | 'REGISTER'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'REFRESH'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_CHANGE'
  | 'EMAIL_VERIFIED'
  | 'SESSION_REVOKED'
  | 'TOKEN_REUSE_DETECTED'
  | 'LOCKOUT';

export interface AuditInput {
  userId?: string | null;
  sessionId?: string | null;
  event: AuthEvent;
  ipAddress?: string | null;
  userAgent?: string | null;
  success: boolean;
  detail?: string | null;
}

export async function auditLog(input: AuditInput): Promise<void> {
  try {
    await db.authAuditLog.create({
      data: {
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        event: input.event,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        success: input.success,
        detail: input.detail ?? null,
      },
    });
  } catch (err: any) {
    // Audit logging must never break the auth flow; log and continue.
    logger.warn({ err: { message: err.message }, event: input.event }, 'authAuditLog write failed');
  }
}

/** Convenience shorthands for readability at call sites. */
export const audit = {
  register: (i: Pick<AuditInput, 'userId' | 'ipAddress' | 'userAgent' | 'detail'>) =>
    auditLog({ ...i, event: 'REGISTER', success: true }),
  loginSuccess: (i: Pick<AuditInput, 'userId' | 'ipAddress' | 'userAgent' | 'sessionId' | 'detail'>) =>
    auditLog({ ...i, event: 'LOGIN_SUCCESS', success: true }),
  loginFailure: (i: Pick<AuditInput, 'userId' | 'ipAddress' | 'userAgent' | 'detail'>) =>
    auditLog({ ...i, event: 'LOGIN_FAILURE', success: false }),
  logout: (i: Pick<AuditInput, 'userId' | 'ipAddress' | 'userAgent' | 'sessionId' | 'detail'>) =>
    auditLog({ ...i, event: 'LOGOUT', success: true }),
  refresh: (i: Pick<AuditInput, 'userId' | 'ipAddress' | 'userAgent' | 'sessionId' | 'detail'>) =>
    auditLog({ ...i, event: 'REFRESH', success: true }),
  tokenReuse: (i: Pick<AuditInput, 'userId' | 'ipAddress' | 'userAgent' | 'detail'>) =>
    auditLog({ ...i, event: 'TOKEN_REUSE_DETECTED', success: false }),
  passwordResetRequest: (i: Pick<AuditInput, 'userId' | 'ipAddress' | 'userAgent' | 'detail'>) =>
    auditLog({ ...i, event: 'PASSWORD_RESET_REQUEST', success: true }),
  passwordChange: (i: Pick<AuditInput, 'userId' | 'ipAddress' | 'userAgent' | 'detail'>) =>
    auditLog({ ...i, event: 'PASSWORD_CHANGE', success: true }),
  lockout: (i: Pick<AuditInput, 'userId' | 'ipAddress' | 'userAgent' | 'detail'>) =>
    auditLog({ ...i, event: 'LOCKOUT', success: false }),
  sessionRevoked: (i: Pick<AuditInput, 'userId' | 'ipAddress' | 'userAgent' | 'sessionId' | 'detail'>) =>
    auditLog({ ...i, event: 'SESSION_REVOKED', success: true }),
  emailVerified: (i: Pick<AuditInput, 'userId' | 'ipAddress' | 'userAgent' | 'detail'>) =>
    auditLog({ ...i, event: 'EMAIL_VERIFIED', success: true }),
};
