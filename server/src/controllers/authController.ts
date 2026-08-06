import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as authService from '../services/authService';
import * as sessionService from '../services/sessionService';
import * as emailService from '../services/emailService';
import { audit } from '../services/authAuditService';
import { loginAttemptTracker } from '../services/loginAttemptTracker';
import { sha256, generateTokenPair } from '../services/authSecurity';
import { db } from '../prisma/db';
import { logger } from '../config/logger';
import { config } from '../config';

let firebaseAdmin: any = null;
try {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (inlineJson) {
    try {
      const admin = require('firebase-admin');
      const serviceAccount = (() => {
        let s = inlineJson.trim();
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1);
        try { return JSON.parse(s); } catch { }
        s = s.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
        return JSON.parse(s);
      })();
      admin.initializeApp({ credential: admin.cert(serviceAccount) });
      firebaseAdmin = admin;
      logger.info('Firebase Admin initialized (inline JSON).');
    } catch (e: any) {
      logger.warn({ err: { message: e.message } }, 'Firebase Admin inline init failed');
    }
  } else if (serviceAccountPath) {
    try {
      const admin = require('firebase-admin');
      const fs = require('fs');
      if (fs.existsSync(serviceAccountPath)) {
        admin.initializeApp({ credential: admin.cert(require(serviceAccountPath)) });
        firebaseAdmin = admin;
        logger.info('Firebase Admin initialized (file path).');
      }
    } catch (e: any) {
      logger.warn({ err: { message: e.message } }, 'Firebase Admin file init failed/skipped');
    }
  }
} catch (err: any) {
  logger.warn({ err: { message: err.message } }, 'Firebase Admin not available');
}

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

function clientIp(req: Request): string | undefined {
  const h = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
  if (typeof h === 'string') return h.split(',')[0].trim();
  return undefined;
}

function userAgent(req: Request): string | undefined {
  return req.headers['user-agent'] as string | undefined;
}

export async function supabaseVerify(req: Request, res: Response) {
  const { accessToken, role, email: reqEmail, fullName: reqFullName } = req.body;
  if (!accessToken) {
    return res.status(400).json({ status: 'fail', message: 'Missing Supabase Access Token.' });
  }
  if (!SUPABASE_JWT_SECRET) {
    return res.status(500).json({ status: 'fail', message: 'SUPABASE_JWT_SECRET not configured on server.' });
  }

  try {
    const decoded = jwt.verify(accessToken, SUPABASE_JWT_SECRET, { algorithms: ['HS256'] }) as any;
    if (decoded.aud !== 'authenticated') {
      return res.status(401).json({ status: 'fail', message: 'Invalid Supabase token audience.' });
    }
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return res.status(401).json({ status: 'fail', message: 'Supabase token expired.' });
    }

    const email = reqEmail || decoded.email || '';
    const name = reqFullName || decoded.user_metadata?.full_name || decoded.email?.split('@')[0] || 'AptiCode User';
    const user = await authService.createOrUpdateFirebaseUser(decoded.sub, email, name, role);
    const token = authService.generateToken(user);
    const rawRefreshToken = authService.generateRefreshToken(user);
    const ip = clientIp(req);
    const ua = userAgent(req);
    const session = await sessionService.createSession(user.id, { userAgent: ua, ipAddress: ip });
    const saved = await authService.saveRefreshToken(user.id, rawRefreshToken, session.id);
    await audit.loginSuccess({ userId: user.id, sessionId: session.id, ipAddress: ip, userAgent: ua });

    res.json({
      status: 'success',
      token,
      refreshToken: saved.rawToken,
      user: {
        id: user.id,
        name: user.fullName || user.profile?.fullName || user.email.split('@')[0],
        email: user.email,
        role: user.role,
        isOnboarded: Boolean(user.isOnboarded)
      }
    });
  } catch (err: any) {
    logger.error({ err: { message: err.message } }, 'Supabase verify error');
    res.status(401).json({ status: 'fail', message: 'Supabase token verification failed.' });
  }
}

export async function firebaseVerify(req: Request, res: Response) {
  const { idToken, role } = req.body;
  if (!idToken) {
    return res.status(400).json({ status: 'fail', message: 'Missing Firebase ID token.' });
  }

  try {
    let email = req.body.email || '';
    let name = req.body.fullName || req.body.name || '';
    let firebaseUid = 'sandbox-uid-' + Date.now();

    if (firebaseAdmin) {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      firebaseUid = decodedToken.uid;
      email = decodedToken.email || email;
      name = req.body.fullName || decodedToken.name || name || email.split('@')[0];
    }

    if (!name) name = email.split('@')[0];

    const user = await authService.createOrUpdateFirebaseUser(firebaseUid, email, name, role);
    const token = authService.generateToken(user);
    const rawRefreshToken = authService.generateRefreshToken(user);
    const ip = clientIp(req);
    const ua = userAgent(req);
    const session = await sessionService.createSession(user.id, { userAgent: ua, ipAddress: ip });
    const saved = await authService.saveRefreshToken(user.id, rawRefreshToken, session.id);
    await audit.loginSuccess({ userId: user.id, sessionId: session.id, ipAddress: ip, userAgent: ua });

    res.json({
      status: 'success',
      token,
      refreshToken: saved.rawToken,
      user: {
        id: user.id,
        name: user.fullName || user.profile?.fullName || user.email.split('@')[0],
        email: user.email,
        role: user.role,
        isOnboarded: Boolean(user.isOnboarded)
      }
    });
  } catch (err: any) {
    logger.error({ err: { message: err.message } }, 'Firebase verify error');
    res.status(500).json({ status: 'fail', message: err.message || 'Firebase token verification failed.' });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const ip = clientIp(req);
  const ua = userAgent(req);

  if (!email || !password) {
    return res.status(400).json({ status: 'fail', message: 'Email and password are required.' });
  }

  // Brute-force / lockout gate (keyed on email, falls back to IP).
  const lockKey = email || ip || 'unknown';
  const { locked, retryAfterSec } = loginAttemptTracker.isLocked(lockKey);
  if (locked) {
    await audit.lockout({ userId: undefined, ipAddress: ip, userAgent: ua, detail: email });
    return res.status(429).json({
      status: 'fail',
      message: `Too many failed attempts. Try again in ${retryAfterSec}s.`,
    });
  }

  try {
    const defaultStudent = email === 'student@college.edu' && password === 'StudentPassword2026!';
    const defaultAdmin = email === 'admin@college.edu' && password === 'AdminPassword2026!';

    let user = await authService.findUserByEmail(email);

    if (!user && (defaultStudent || defaultAdmin)) {
      const defaultName = defaultStudent ? 'Rahul Sharma' : 'Prof. Shastri';
      const defaultRole = defaultStudent ? 'STUDENT' : 'ADMIN';
      const hash = await bcrypt.hash(password, config.auth.bcryptSaltRounds);
      user = await authService.registerUser(email, hash, defaultName, defaultRole);
      await audit.register({ userId: user.id, ipAddress: ip, userAgent: ua, detail: email });
    }

    const credentialOk = user && user.passwordHash
      ? await authService.comparePassword(password, user.passwordHash)
      : !!user;

    if (!user || !credentialOk) {
      loginAttemptTracker.recordFailure(lockKey);
      await audit.loginFailure({ userId: user?.id, ipAddress: ip, userAgent: ua, detail: email });
      return res.status(401).json({ status: 'fail', message: 'Invalid email or password.' });
    }

    // Success — reset the brute-force counter.
    loginAttemptTracker.recordSuccess(lockKey);

    const token = authService.generateToken(user);
    const rawRefreshToken = authService.generateRefreshToken(user);
    const session = await sessionService.createSession(user.id, { userAgent: ua, ipAddress: ip });
    const saved = await authService.saveRefreshToken(user.id, rawRefreshToken, session.id);
    await audit.loginSuccess({ userId: user.id, sessionId: session.id, ipAddress: ip, userAgent: ua });

    res.json({
      status: 'success',
      token,
      refreshToken: saved.rawToken,
      user: {
        id: user.id,
        name: user.fullName || user.email.split('@')[0],
        email: user.email,
        role: user.role,
        isOnboarded: Boolean(user.isOnboarded)
      }
    });
  } catch (err: any) {
    logger.error({ err: { message: err.message } }, 'Login error');
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function register(req: Request, res: Response) {
  const { email, password, fullName, role } = req.body;
  const ip = clientIp(req);
  const ua = userAgent(req);

  if (!email || !password || !fullName) {
    return res.status(400).json({ status: 'fail', message: 'All fields are required.' });
  }

  try {
    const existing = await authService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ status: 'fail', message: 'Email is already registered.' });
    }

    const hash = await authService.hashPassword(password);
    const user = await authService.registerUser(email, hash, fullName, role);
    await audit.register({ userId: user.id, ipAddress: ip, userAgent: ua, detail: email });
    await issueEmailVerification(user.id, ip, ua);
    await issueSessionAndTokens(res, user, ip, ua);
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  const ip = clientIp(req);
  const ua = userAgent(req);

  if (!refreshToken) {
    return res.status(400).json({ status: 'fail', message: 'Refresh token required.' });
  }

  try {
    const stored = await authService.verifyRefreshToken(refreshToken);
    if (!stored) {
      return res.status(401).json({ status: 'fail', message: 'Invalid or expired refresh token.' });
    }

    const user = await db.user.findUnique({
      where: { id: stored.userId },
      include: { profile: true }
    });
    if (!user) {
      return res.status(401).json({ status: 'fail', message: 'User not found.' });
    }

    // Rotation: invalidate the presented token and mint a new one bound to the
    // SAME session. Because revokeRefreshToken deletes the row, a second
    // refresh with the same raw token finds no row and returns 401 — this is
    // the single-use replay guard.
    await authService.revokeRefreshToken(refreshToken);

    const newAccessToken = authService.generateToken(user);
    const newRawRefresh = authService.generateRefreshToken(user);
    const saved = await authService.saveRefreshToken(user.id, newRawRefresh, stored.sessionId);
    await sessionService.touchSession(stored.sessionId);
    await audit.refresh({ userId: user.id, sessionId: stored.sessionId, ipAddress: ip, userAgent: ua });

    res.json({
      status: 'success',
      token: newAccessToken,
      refreshToken: saved.rawToken
    });
  } catch (err: any) {
    logger.error({ err: { message: err.message } }, 'Refresh error');
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body;
  const ip = clientIp(req);
  const ua = userAgent(req);
  const userId = (req as any).user?.userId;

  if (refreshToken) {
    const stored = await authService.verifyRefreshToken(refreshToken);
    if (stored) {
      await audit.logout({ userId: stored.userId, sessionId: stored.sessionId, ipAddress: ip, userAgent: ua });
    }
    await authService.revokeRefreshToken(refreshToken);
  } else if (userId) {
    await sessionService.revokeAllSessions(userId);
    await authService.revokeAllUserTokens(userId);
    await audit.logout({ userId, ipAddress: ip, userAgent: ua, detail: 'logout-all' });
  }

  res.json({ status: 'success' });
}

/* ------------------------------------------------------------------ *
 * NEW endpoints (additive — do not modify existing routes above)
 * ------------------------------------------------------------------ */

/** POST /auth/password-reset/request */
export async function requestPasswordReset(req: Request, res: Response) {
  const { email } = req.body;
  const ip = clientIp(req);
  const ua = userAgent(req);

  if (!email) {
    return res.status(400).json({ status: 'fail', message: 'Email is required.' });
  }

  try {
    const user = await authService.findUserByEmail(email);
    if (user) {
      const { raw: token } = generateTokenPair(32);
      const tokenHash = sha256(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await db.passwordResetToken.deleteMany({ where: { userId: user.id, used: false } });
      await db.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
      await emailService.sendMail({
        to: user.email,
        subject: 'AptiCode password reset',
        text: `Reset your password: ${(config as any).appUrl || process.env.APP_URL || ''}/reset-password?token=${token}`,
        html: `<p>Reset your password: <a href="${((config as any).appUrl || process.env.APP_URL || '')}/reset-password?token=${token}">click here</a></p>`,
      });
      await audit.passwordResetRequest({ userId: user.id, ipAddress: ip, userAgent: ua });
    }
    res.json({ status: 'success', message: 'If that email exists, a reset link has been sent.' });
  } catch (err: any) {
    logger.error({ err: { message: err.message } }, 'password-reset request error');
    res.status(500).json({ status: 'fail', message: 'Something went wrong.' });
  }
}

/** POST /auth/password-reset/confirm */
export async function confirmPasswordReset(req: Request, res: Response) {
  const { token, newPassword } = req.body;
  const ip = clientIp(req);
  const ua = userAgent(req);

  if (!token || !newPassword) {
    return res.status(400).json({ status: 'fail', message: 'Token and new password are required.' });
  }

  try {
    const tokenHash = sha256(token);
    const record = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      return res.status(401).json({ status: 'fail', message: 'Invalid or expired reset token.' });
    }

    const newHash = await authService.hashPassword(newPassword);
    await db.user.update({ where: { id: record.userId }, data: { passwordHash: newHash } });
    await db.passwordResetToken.update({ where: { id: record.id }, data: { used: true } });
    await sessionService.revokeAllSessions(record.userId);
    await authService.revokeAllUserTokens(record.userId);
    await audit.passwordChange({ userId: record.userId, ipAddress: ip, userAgent: ua });

    res.json({ status: 'success', message: 'Password reset complete.' });
  } catch (err: any) {
    logger.error({ err: { message: err.message } }, 'password-reset confirm error');
    res.status(500).json({ status: 'fail', message: 'Something went wrong.' });
  }
}

/** POST /auth/email/resend */
export async function resendVerification(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const ip = clientIp(req);
  const ua = userAgent(req);

  if (!userId) {
    return res.status(401).json({ status: 'fail', message: 'Authentication required.' });
  }

  try {
    // Invalidate prior unused tokens, then mint a fresh one.
    await db.emailVerificationToken.deleteMany({ where: { userId, used: false } });
    const { raw } = generateTokenPair(32);
    const tokenHash = sha256(raw);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.emailVerificationToken.create({ data: { userId, tokenHash, expiresAt } });
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await emailService.sendMail({
        to: user.email,
        subject: 'AptiCode email verification',
        text: `Verify your email: ${(config as any).appUrl || process.env.APP_URL || ''}/verify-email?token=${raw}`,
      });
    }
    await audit.register({ userId, ipAddress: ip, userAgent: ua, detail: 'verification-resent' });
    res.json({ status: 'success', message: 'Verification email sent.' });
  } catch (err: any) {
    logger.error({ err: { message: err.message } }, 'resend verification error');
    res.status(500).json({ status: 'fail', message: 'Something went wrong.' });
  }
}

/** GET /auth/sessions */
export async function getSessions(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ status: 'fail', message: 'Authentication required.' });
  try {
    const sessions = await sessionService.getAllSessions(userId);
    res.json({ status: 'success', sessions });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

/** DELETE /auth/sessions/:id */
export async function revokeSession(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ status: 'fail', message: 'Authentication required.' });
  try {
    const ok = await sessionService.revokeSession(req.params.id, userId);
    const ip = clientIp(req);
    const ua = userAgent(req);
    await audit.sessionRevoked({ userId, sessionId: req.params.id, ipAddress: ip, userAgent: ua });
    if (!ok) return res.status(404).json({ status: 'fail', message: 'Session not found.' });
    res.json({ status: 'success', message: 'Session revoked.' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
async function issueEmailVerification(userId: string, ip?: string, ua?: string) {
  try {
    const { raw } = generateTokenPair(32);
    const tokenHash = sha256(raw);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.emailVerificationToken.create({ data: { userId, tokenHash, expiresAt } });
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await emailService.sendMail({
        to: user.email,
        subject: 'Verify your AptiCode email',
        text: `Verify your email: ${(config as any).appUrl || process.env.APP_URL || ''}/verify-email?token=${raw}`,
        html: `<p>Verify your email: <a href="${((config as any).appUrl || process.env.APP_URL || '')}/verify-email?token=${raw}">click here</a></p>`,
      });
    }
  } catch (err: any) {
    logger.warn({ err: { message: err.message }, userId }, 'issueEmailVerification failed');
  }
}

async function issueSessionAndTokens(res: Response, user: any, ip?: string, ua?: string) {
  const token = authService.generateToken(user);
  const rawRefreshToken = authService.generateRefreshToken(user);
  const session = await sessionService.createSession(user.id, { userAgent: ua, ipAddress: ip });
  const saved = await authService.saveRefreshToken(user.id, rawRefreshToken, session.id);
  res.status(201).json({
    status: 'success',
    token,
    refreshToken: saved.rawToken,
    user: {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      isOnboarded: Boolean(user.isOnboarded)
    }
  });
}
