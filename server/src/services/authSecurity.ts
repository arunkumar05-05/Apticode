/**
 * Authentication security primitives.
 *
 * - SHA-256 hashing of refresh/reset/verification tokens before storage.
 *   We store only the hash; the raw token is returned to the caller exactly
 *   once at issuance. Length distinguishes legacy plaintext (128 hex chars)
 *   from new hashes (64 hex chars) for the dual-format migration in
 *   authService.verifyRefreshToken.
 *
 * - Constant-time comparison via `crypto.timingSafeEqual` for any direct
 *   token equality checks (refresh/replay detection).
 *
 * - No sensitive data (passwords, JWTs, raw tokens) is ever logged.
 */
import crypto from 'node:crypto';

/** Length of a freshly generated refresh token (raw hex, before hashing). */
export const REFRESH_TOKEN_BYTES = 64;

/** Length of a password-reset / email-verification token (raw hex, before hashing). */
export const ONE_TIME_TOKEN_BYTES = 32;

/** SHA-256 hex digest of a token (what gets stored). */
export const HASH_BYTES = 32; // -> 64 hex chars

/**
 * Generate a cryptographically-random token and its SHA-256 storage hash.
 * Returns both: the raw token (to give the client) and the hash (to persist).
 */
export function generateTokenPair(bytes = ONE_TIME_TOKEN_BYTES): {
  raw: string;
  hash: string;
} {
  const raw = crypto.randomBytes(bytes).toString('hex');
  const hash = sha256(raw);
  return { raw, hash };
}

/** SHA-256 hex digest (lowercase) of an arbitrary string. */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/** Constant-time string equality for token comparison / replay checks. */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Legacy detection: plaintext refresh tokens were 128 hex chars; hashes are 64. */
export function isLegacyPlaintextToken(stored: string): boolean {
  return /^[0-9a-f]{128}$/i.test(stored);
}
