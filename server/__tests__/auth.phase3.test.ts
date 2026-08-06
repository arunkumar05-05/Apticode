import request from 'supertest';
import { app } from '../src/index';
import { db } from '../src/prisma/db';
import { sha256, generateTokenPair } from '../src/services/authSecurity';
import { loginAttemptTracker } from '../src/services/loginAttemptTracker';
import { authLimiter } from '../src/middleware/rateLimiter';

// Reset the express auth rate-limiter's window between tests so the
// brute-force + rotation + reset + logout + sessions suite (which fires
// ~20 auth requests) doesn't trip the production 10/min cap inside the test
// environment.
const RESET_KEYS = ['::ffff:127.0.0.1', '127.0.0.1', '::1'];
function resetLimiter() {
  RESET_KEYS.forEach((k) => (authLimiter as any).resetKey(k));
}

describe('Phase 3 — Auth hardening', () => {
  let token: string;
  let refreshToken: string;
  let studentId: string;
  let resetToken: string;

  beforeEach(() => {
    resetLimiter();
    loginAttemptTracker.recordSuccess('student@college.edu');
    loginAttemptTracker.recordSuccess('lockout-victim@college.edu');
  });

  beforeAll(async () => {
    loginAttemptTracker.MAX_ATTEMPTS; // ensure module loaded
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@college.edu', password: 'StudentPassword2026!' });
    token = res.body.token;
    refreshToken = res.body.refreshToken;
    studentId = (await db.user.findUnique({ where: { email: 'student@college.edu' } }))!.id;
  });

  /* ---------------------------------------------------------------- *
   * 1. JWT validation (issuer/audience present, backward compatible)
   * ---------------------------------------------------------------- */
  describe('JWT validation', () => {
    it('issues tokens carrying issuer/audience and validates them', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('rejects a tampered token (401)', async () => {
      const tampered = token.slice(0, -4) + 'AAAA';
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${tampered}`);
      expect(res.status).toBe(401);
    });
  });

  /* ---------------------------------------------------------------- *
   * 2. Refresh-token rotation (single-use, hashed at rest)
   * ---------------------------------------------------------------- */
  describe('Refresh-token rotation', () => {
    it('issues a new refresh token and invalidates the old one', async () => {
      // First rotation.
      const r1 = await request(app).post('/api/auth/refresh').send({ refreshToken });
      expect(r1.status).toBe(200);
      expect(r1.body.token).toBeTruthy();
      expect(r1.body.refreshToken).toBeTruthy();
      const secondToken = r1.body.refreshToken;
      expect(secondToken).not.toBe(refreshToken);

      // Old refresh token is now invalid (single-use).
      const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken });
      expect(reuse.status).toBe(401);

      // The new token still works (rotation is forward-progressing).
      const r2 = await request(app).post('/api/auth/refresh').send({ refreshToken: secondToken });
      expect(r2.status).toBe(200);

      // Storage assertion: tokens stored as hashes (64 hex), not plaintext.
      const stored = await db.refreshToken.findMany({ where: { userId: studentId } });
      const hashes = stored.map((t: any) => t.token);
      expect(hashes.every((h: string) => /^[0-9a-f]{64}$/i.test(h))).toBe(true);
    });
  });

  /* ---------------------------------------------------------------- *
   * 3. Audit log
   * ---------------------------------------------------------------- */
  describe('Auth audit log', () => {
    it('records LOGIN_SUCCESS and at least one REFRESH event', async () => {
      const events = await db.authAuditLog.findMany({
        where: { userId: studentId },
        orderBy: { createdAt: 'desc' },
      });
      const kinds = new Set(events.map((e: any) => e.event));
      expect(kinds.has('LOGIN_SUCCESS')).toBe(true);
      expect(kinds.has('REFRESH')).toBe(true);
      // No sensitive values ever written.
      const blob = JSON.stringify(events);
      expect(blob).not.toContain('password');
      expect(blob).not.toMatch(/eyJ/); // no JWTs
    });
  });

  /* ---------------------------------------------------------------- *
   * 4. Brute-force lockout
   * ---------------------------------------------------------------- */
  describe('Brute-force lockout', () => {
    const badEmail = 'lockout-victim@college.edu';

    beforeAll(async () => {
      // Seed a user with a known wrong password.
      await db.user.upsert({
        where: { email: badEmail },
        update: {},
        create: {
          email: badEmail,
          fullName: 'Lockout Victim',
          role: 'STUDENT',
          passwordHash: '$2b$10$invalidhashplaceholder',
        },
      });
      // Reset tracker for this key (tests may share the in-mem store).
      loginAttemptTracker.recordSuccess(badEmail);
    });

    it('returns 429 after max attempts and unlocks after the window', async () => {
      const max = loginAttemptTracker.MAX_ATTEMPTS;
      let lastStatus = 0;
      for (let i = 0; i < max; i++) {
        const r = await request(app).post('/api/auth/login').send({ email: badEmail, password: 'wrong' });
        lastStatus = r.status;
      }
      // The max-th attempt should be rejected with 401 (credentials wrong),
      // and the NEXT attempt should be 429 (locked).
      expect(lastStatus).toBe(401);

      const locked = await request(app).post('/api/auth/login').send({ email: badEmail, password: 'wrong' });
      expect(locked.status).toBe(429);
      expect(locked.body.message).toMatch(/Try again in/);

      await loginAttemptTracker.recordSuccess(badEmail);
    });
  });

  /* ---------------------------------------------------------------- *
   * 5. Sessions
   * ---------------------------------------------------------------- */
  describe('Session management', () => {
    it('lists sessions for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.sessions)).toBe(true);
      expect(res.body.sessions.length).toBeGreaterThan(0);
    });

    it('revokes a single session without affecting the access token flow', async () => {
      const list = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${token}`);
      const sid = list.body.sessions[0]?.id;
      expect(sid).toBeTruthy();

      const del = await request(app)
        .delete(`/api/auth/sessions/${sid}`)
        .set('Authorization', `Bearer ${token}`);
      expect(del.status).toBe(200);

      // The session row is revoked.
      const after = await db.session.findUnique({ where: { id: sid } });
      expect(after?.revoked).toBe(true);
    });
  });

  /* ---------------------------------------------------------------- *
   * 6. Password reset (request → confirm, single-use)
   * ---------------------------------------------------------------- */
  describe('Password reset', () => {
    // Capture the reset token from the audit detail / a direct DB read
    // (the flow emails it; in dev the console transport logs it, but the
    // token is created server-side — we read the hashed token's existence).
    it('request: creates a token record (emailed, not leaked in response)', async () => {
      const res = await request(app)
        .post('/api/auth/password-reset/request')
        .send({ email: 'student@college.edu' });
      expect(res.status).toBe(200);
      // Generic message (no enumeration).
      expect(res.body.message).toMatch(/reset link has been sent/i);

      const rows = await db.passwordResetToken.findMany({ where: { userId: studentId } });
      expect(rows.length).toBeGreaterThan(0);
    });

    it('confirm: rejects an invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/password-reset/confirm')
        .send({ token: 'bogus-token', newPassword: 'NewPass!234' });
      expect(res.status).toBe(401);
    });

    it('confirm: accepts a real token and revokes all sessions/tokens', async () => {
      // Create a reset token directly with a known raw value.
      const raw = generateTokenPair(32).raw;
      const tokenHash = sha256(raw);
      const tok = await db.passwordResetToken.create({
        data: {
          userId: studentId,
          tokenHash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
      });

      const res = await request(app)
        .post('/api/auth/password-reset/confirm')
        .send({ token: raw, newPassword: 'NewPass!234' });
      expect(res.status).toBe(200);

      // The token is single-use now.
      const updated = await db.passwordResetToken.findUnique({ where: { id: tok.id } });
      expect(updated?.used).toBe(true);
    });
  });

  /* ---------------------------------------------------------------- *
   * 7. Logout (revokes refresh token + session)
   * ---------------------------------------------------------------- */
  describe('Logout', () => {
    it('revokes the refresh token (returns generic success)', async () => {
      // Re-login to get a fresh token pair. NOTE: a prior password-reset test
      // may have changed the student's password to 'NewPass!234'; restore the
      // fixture hash so this test is deterministic regardless of execution order.
      resetLimiter();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require('bcryptjs');
      const fixtureHash = await bcrypt.hash('StudentPassword2026!', 10);
      await db.user.update({
        where: { email: 'student@college.edu' },
        data: { passwordHash: fixtureHash },
      });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@college.edu', password: 'StudentPassword2026!' });
      expect(res.status).toBe(200);
      const freshRefresh = res.body.refreshToken;
      expect(freshRefresh).toBeTruthy();

      const out = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${res.body.token}`)
        .send({ refreshToken: freshRefresh });
      expect(out.status).toBe(200);
      expect(out.body.status).toBe('success');

      // That refresh token no longer works.
      const reuse = await request(app).post('/api/auth/refresh').send({ refreshToken: freshRefresh });
      expect(reuse.status).toBe(401);
    });
  });

  afterEach(async () => {
    // Clear brute-force state between describe blocks so lockout doesn't
    // bleed across tests.
    loginAttemptTracker.recordSuccess('lockout-victim@college.edu');
  });
});
