/**
 * Session management.
 *
 * A Session represents a device/browser session for a user. Refresh tokens are
 * bound to a Session (RefreshToken.sessionId). Sessions are created on login,
 * revoked on logout, and can be individually revoked via DELETE /auth/sessions/:id
 * without affecting other sessions.
 *
 * Sessions expire (default 30 days, configurable). A cleanup sweeper is not
 * required for correctness; expired-but-active sessions are filtered in
 * getActiveSessions and treated as invalid on use.
 */
import { db } from '../prisma/db';
import { logger } from '../config/logger';
import { randomBytes } from 'node:crypto';
import { config } from '../config';

const SESSION_TTL_DAYS = 30;

export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  revoked: boolean;
}

export interface DeviceHint {
  userAgent?: string;
  ipAddress?: string;
}

/** Create a new session for a user. Returns the session id. */
export async function createSession(userId: string, hint: DeviceHint): Promise<{ id: string }> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const session = await db.session.create({
    data: {
      userId,
      deviceInfo: parseDeviceInfo(hint.userAgent),
      userAgent: hint.userAgent ?? null,
      ipAddress: hint.ipAddress ?? null,
      expiresAt,
    },
  });
  return { id: session.id };
}

function parseDeviceInfo(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

/** All sessions for a user (active first). */
export async function getActiveSessions(userId: string): Promise<SessionInfo[]> {
  const now = new Date();
  return (await db.session.findMany({
    where: { userId, revoked: false, expiresAt: { gt: now } },
    orderBy: { lastActivity: 'desc' },
  })) as SessionInfo[];
}

export async function getAllSessions(userId: string): Promise<SessionInfo[]> {
  return (await db.session.findMany({
    where: { userId },
    orderBy: { lastActivity: 'desc' },
  })) as SessionInfo[];
}

/** Revoke a single session by id, scoped to the user. */
export async function revokeSession(sessionId: string, userId: string): Promise<boolean> {
  const updated = await db.session.updateMany({
    where: { id: sessionId, userId },
    data: { revoked: true },
  });
  return updated.count > 0;
}

/** Revoke all sessions for a user (used on password change / full logout). */
export async function revokeAllSessions(userId: string): Promise<number> {
  const updated = await db.session.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
  return updated.count;
}

/** Touch lastActivity (called on each successful refresh). */
export async function touchSession(sessionId: string | null | undefined): Promise<void> {
  if (!sessionId) return;
  try {
    await db.session.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });
  } catch (err: any) {
    logger.warn({ err: { message: err.message }, sessionId }, 'session touch failed');
  }
}
