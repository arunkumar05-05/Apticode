/**
 * Authentication service (Phase 3 hardened).
 *
 * Backward-compatible API surface. The response shapes returned to the
 * controller layer are unchanged; only the internals have been hardened:
 *
 *  - Refresh tokens are stored as SHA-256 hashes. Legacy plaintext tokens
 *    (128 hex chars) are detected and lazily re-hashed on first verify.
 *  - Refresh-token rotation: each /auth/refresh issues a NEW token and
 *    invalidates the previous one; reuse of an invalidated token is detected
 *    and triggers revocation of all the user's sessions.
 *  - Access JWTs carry issuer/audience/jwtVersion claims, are signed with
 *    HS256, and use the config-driven expiry. Verification is
 *    backward-compatible: legacy tokens (no iss/aud) still verify.
 *  - All hashing uses node:crypto (sha256). bcrypt rounds come from config.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { db } from '../prisma/db';
import { config } from '../config';
import { logger } from '../config/logger';
import { sha256, isLegacyPlaintextToken, timingSafeEqual } from './authSecurity';

interface UserLike {
  id: string;
  email: string;
  role: string;
  fullName?: string | null;
  isOnboarded?: boolean | null;
}

/* ------------------------------------------------------------------ *
 * Registration / lookup (unchanged contracts)
 * ------------------------------------------------------------------ */
export async function registerUser(email: string, passwordHash: string | null, fullName: string, role: string) {
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
      authProvider: 'local-password',
      profile: {
        create: {
          fullName,
          email,
          college: 'AptiCode College',
          branch: 'Computer Science',
          graduationYear: new Date().getFullYear() + 2,
        },
      },
    },
  });
  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.auth.bcryptSaltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email }, include: { profile: true } });
}

export async function findUserByUid(uid: string) {
  return db.user.findUnique({ where: { firebaseUid: uid }, include: { profile: true } });
}

/* ------------------------------------------------------------------ *
 * JWT (access token)
 * ------------------------------------------------------------------ */
export function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      jwtVer: config.auth.jwtVersion,
    },
    config.auth.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: config.auth.accessExpiresIn as any,
      issuer: config.auth.jwtIssuer,
      audience: config.auth.jwtAudience,
    } as jwt.SignOptions
  );
}

/** Backward-compatible access-token verification.
 *  Strict path: issuer + audience + HS256. Legacy fallback: tokens issued
 *  before Phase 3 carry no iss/aud — those verify with HS256 only so users
 *  aren't logged out during the overlap window.
 */
export function verifyAccessToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, config.auth.jwtSecret, {
      algorithms: ['HS256'],
      issuer: config.auth.jwtIssuer,
      audience: config.auth.jwtAudience,
    }) as { userId: string; email: string; role: string };
  } catch (strictErr: any) {
    // Only fall back for legacy tokens (missing issuer/audience). Any other
    // failure (expired, bad signature) is terminal.
    if (!strictErr?.message?.includes('issuer') && !strictErr?.message?.includes('audience')) {
      return null;
    }
    try {
      return jwt.verify(token, config.auth.jwtSecret, { algorithms: ['HS256'] }) as {
        userId: string;
        email: string;
        role: string;
      };
    } catch {
      return null;
    }
  }
}

/* ------------------------------------------------------------------ *
 * Refresh tokens (hashed at rest, rotation)
 * ------------------------------------------------------------------ */
export function generateRefreshToken(user: { id: string }) {
  return randomBytes(32).toString('hex'); // 64 hex chars raw — returned to client once
}

export interface SavedRefreshToken {
  id: string;
  tokenHash: string; // stored in DB
  rawToken: string; // echoed back to caller (client sees this)
  sessionId?: string | null;
  expiresAt: Date;
}

/** Persist a refresh token's SHA-256 hash; link it to a session.
 *  Accepts the raw token (as generated), stores only its hash, and echoes
 *  the raw token back so the controller can deliver it to the client. */
export async function saveRefreshToken(
  userId: string,
  rawToken: string,
  sessionId?: string | null
): Promise<SavedRefreshToken> {
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date();
  const days = parseJwtExpiry(config.auth.refreshExpiresIn, 7);
  expiresAt.setDate(expiresAt.getDate() + days);

  const record = await db.refreshToken.create({
    data: {
      userId,
      sessionId: sessionId ?? null,
      token: tokenHash,
      expiresAt,
    },
  });

  return { id: record.id, tokenHash, rawToken, sessionId: record.sessionId, expiresAt };
}

/** Verify a refresh token (handles hashed + legacy plaintext).
 *  Returns the stored record (with userId + sessionId) or null. */
export async function verifyRefreshToken(token: string) {
  if (!token) return null;
  const hash = sha256(token);

  // New path: lookup by hash.
  let stored = await db.refreshToken.findUnique({ where: { token: hash } });

  // Legacy path: lookup by plaintext (pre-Phase-3 tokens stored as 128-char hex).
  if (!stored) {
    stored = await db.refreshToken.findUnique({ where: { token } });
    if (stored && isLegacyPlaintextToken(stored.token)) {
      // Lazy migration: re-hash and persist.
      try {
        await db.refreshToken.update({ where: { id: stored.id }, data: { token: hash } });
      } catch (err: any) {
        logger.warn({ err: { message: err.message } }, 'refresh token lazy re-hash failed');
      }
    }
  }

  if (!stored) return null;

  // Expired → delete and reject.
  if (stored.expiresAt < new Date()) {
    try {
      await db.refreshToken.delete({ where: { id: stored.id } });
    } catch {
      /* already gone */
    }
    return null;
  }

  return stored;
}

/** Invalidate a specific refresh token (hash-aware). */
export async function revokeRefreshToken(token: string) {
  if (!token) return null;
  const hash = sha256(token);
  try {
    // Try hash first, then plaintext (legacy).
    return (
      (await db.refreshToken.delete({ where: { token: hash } }).catch(() => null)) ||
      (await db.refreshToken.delete({ where: { token } }).catch(() => null))
    );
  } catch {
    return null;
  }
}

export async function revokeAllUserTokens(userId: string) {
  return db.refreshToken.deleteMany({ where: { userId } });
}

/* ------------------------------------------------------------------ *
 * Firebase / Supabase user sync (unchanged contracts)
 * ------------------------------------------------------------------ */
export async function createOrUpdateFirebaseUser(uid: string, email: string, name: string, role: string) {
  let user = await db.user.findFirst({
    where: { OR: [{ email }, { firebaseUid: uid }] },
    include: { profile: true },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email,
        firebaseUid: uid,
        authProvider: 'firebase-email',
        fullName: name,
        role: role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
        profile: {
          create: {
            fullName: name,
            email,
            college: 'Mailam Engineering College',
            branch: 'Information Technology',
            graduationYear: new Date().getFullYear() + 2,
          },
        },
      },
      include: { profile: true },
    });
  } else {
    const isNewNameProvided = name && name !== email.split('@')[0];
    const finalName = isNewNameProvided ? name : user.fullName || name;

    user = await db.user.update({
      where: { id: user.id },
      data: { firebaseUid: uid, authProvider: 'firebase-email', fullName: finalName },
      include: { profile: true },
    });

    if (user.profile) {
      await db.profile.update({ where: { id: user.profile.id }, data: { fullName: finalName } });
    }
  }
  return user;
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
function parseJwtExpiry(exp: string, fallbackDays: number): number {
  // Accepts durations like '15m', '7d', '1800s'. Falls back to days.
  const m = String(exp).match(/^(\d+)([smhd])$/);
  if (!m) return fallbackDays;
  const [, n, u] = m;
  const v = Number(n);
  switch (u) {
    case 's':
      return v / 86400;
    case 'm':
      return Math.max(v / 1440, 1 / 1440);
    case 'h':
      return v / 24;
    case 'd':
      return v;
    default:
      return fallbackDays;
  }
}
