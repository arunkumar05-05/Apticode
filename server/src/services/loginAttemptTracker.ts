/**
 * Brute-force protection — in-process, per-account attempt tracker.
 *
 * - Keys on email (primary) falling back to source IP when no email is
 *   supplied (e.g. registration bombing on arbitrary emails).
 * - After MAX_ATTEMPTS consecutive failures the account is temporarily
 *  locked. Lock duration doubles with each subsequent trigger
 *   (30s → 60s → 120s → 240s …) capped at MAX_LOCK_SECONDS so accounts
 *   are NEVER permanently locked.
 * - A successful authentication resets the counter.
 *
 * In-memory only (sufficient for single-instance deploys). For multi-node
 * production, back this with Redis via the UPSTASH_REDIS_* config; the
 * interface below is the contract a Redis adapter would implement.
 */
import { logger } from '../config/logger';
import { config } from '../config';

const MAX_ATTEMPTS = config.auth.loginMaxAttempts;
const BASE_LOCK_SECONDS = config.auth.loginLockoutBaseSec;
const MAX_LOCK_SECONDS = config.auth.loginLockoutMaxSec;

interface Record {
  failures: number;
  lockedUntil: number; // epoch ms; 0 = not locked
}

const store = new Map<string, Record>();

function lockFor(failures: number): number {
  // failures >= MAX_ATTEMPTS triggers lock; each additional failure doubles.
  const exponent = Math.min(failures - MAX_ATTEMPTS + 1, 5);
  return Math.min(BASE_LOCK_SECONDS * 2 ** Math.max(0, exponent - 1), MAX_LOCK_SECONDS);
}

export function isLocked(key: string): { locked: boolean; retryAfterSec: number } {
  const rec = store.get(key);
  if (!rec || rec.lockedUntil === 0) return { locked: false, retryAfterSec: 0 };
  const remaining = rec.lockedUntil - Date.now();
  if (remaining <= 0) {
    // Lock window expired — reset so the user can try again.
    store.delete(key);
    return { locked: false, retryAfterSec: 0 };
  }
  return { locked: true, retryAfterSec: Math.ceil(remaining / 1000) };
}

export function recordFailure(key: string) {
  const rec = store.get(key) || { failures: 0, lockedUntil: 0 };
  rec.failures += 1;
  if (rec.failures >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + lockFor(rec.failures) * 1000;
    logger.warn({ email: key, failures: rec.failures, lockedUntil: rec.lockedUntil }, 'Account temporarily locked');
  }
  store.set(key, rec);
}

export function recordSuccess(key: string) {
  if (store.has(key)) store.delete(key);
}

export function getRemaining(key: string): number {
  const rec = store.get(key);
  if (!rec) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - rec.failures);
}

export const loginAttemptTracker = { isLocked, recordFailure, recordSuccess, getRemaining, MAX_ATTEMPTS };
