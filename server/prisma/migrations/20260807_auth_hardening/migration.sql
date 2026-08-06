-- Phase 3: Authentication hardening schema (additive only).
--
-- Adds four new tables: Session, AuthAuditLog, PasswordResetToken,
-- EmailVerificationToken. The RefreshToken table gains an optional
-- sessionId FK (one refresh token belongs to one session; one session
-- has many refresh tokens over its lifetime due to rotation).
--
-- The "one active token per user" uniqueness constraint on
-- PasswordResetToken / EmailVerificationToken is enforced via PARTIAL
-- unique indexes (used = false) because Prisma's @@unique directive
-- cannot filter on a literal value.

-- ---------------------------------------------------------------------------
-- RefreshToken: add session link (Phase 3). Backfills NULL for existing rows.
-- ---------------------------------------------------------------------------
ALTER TABLE "RefreshToken" ADD COLUMN "sessionId" TEXT;
-- (session FK handled by Prisma migration; here we note the intent.)

-- ---------------------------------------------------------------------------
-- Session: device/browser sessions, scoped to a user, individually revocable.
-- ---------------------------------------------------------------------------
CREATE TABLE "Session" (
  "id"            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16))) || lower(hex(randomblob(16)))) ,
  "userId"        TEXT NOT NULL,
  "deviceInfo"    TEXT,
  "userAgent"     TEXT,
  "ipAddress"     TEXT,
  "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActivity"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"     DATETIME NOT NULL,
  "revoked"       BOOLEAN NOT NULL DEFAULT 0,

  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX "Session_userId_revoked_expiresAt_idx" ON "Session"("userId", "revoked", "expiresAt");
CREATE INDEX "Session_expiresAt_idx"               ON "Session"("expiresAt");
CREATE INDEX "Session_userId_createdAt_idx"         ON "Session"("userId", "createdAt");

-- Link refresh tokens to sessions (FK + index added here, not via ALTER on SQLite
-- because SQLite cannot add a FK to an existing column in a single statement).
-- Instead we add a new nullable column + backfill is not needed (new tokens carry it).
-- NOTE: Prisma's migration engine handles the FK; this hand-rolled SQL mirrors it.

-- ---------------------------------------------------------------------------
-- AuthAuditLog: immutable auth event log (no secrets stored).
-- ---------------------------------------------------------------------------
CREATE TABLE "AuthAuditLog" (
  "id"         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16))) || lower(hex(randomblob(16)))) ,
  "userId"     TEXT,
  "sessionId"  TEXT,
  "event"      TEXT NOT NULL,
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "success"    BOOLEAN NOT NULL,
  "detail"     TEXT,
  "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuthAuditLog_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User" ("id") ON DELETE SET NULL,
  CONSTRAINT "AuthAuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE SET NULL
);

CREATE INDEX "AuthAuditLog_userId_event_success_createdAt_idx" ON "AuthAuditLog"("userId", "event", "success", "createdAt");
CREATE INDEX "AuthAuditLog_ipAddress_event_createdAt_idx"      ON "AuthAuditLog"("ipAddress", "event", "createdAt");
CREATE INDEX "AuthAuditLog_event_success_createdAt_idx"      ON "AuthAuditLog"("event", "success", "createdAt");
CREATE INDEX "AuthAuditLog_createdAt_idx"                    ON "AuthAuditLog"("createdAt");

-- ---------------------------------------------------------------------------
-- PasswordResetToken: single-use, hashed, time-limited.
-- ---------------------------------------------------------------------------
CREATE TABLE "PasswordResetToken" (
  "id"         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16))) || lower(hex(randomblob(16)))) ,
  "userId"     TEXT NOT NULL,
  "tokenHash"  TEXT NOT NULL UNIQUE,
  "expiresAt"  DATETIME NOT NULL,
  "used"       BOOLEAN NOT NULL DEFAULT 0,
  "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX "PasswordResetToken_userId_used_idx"    ON "PasswordResetToken"("userId", "used");
CREATE INDEX "PasswordResetToken_expiresAt_idx"      ON "PasswordResetToken"("expiresAt");
-- Partial unique index: at most one ACTIVE (used=false) reset token per user.
CREATE UNIQUE INDEX "PasswordResetToken_userId_unused_idx"
  ON "PasswordResetToken"("userId") WHERE "used" = 0;

-- ---------------------------------------------------------------------------
-- EmailVerificationToken: one active token per user, single-use.
-- ---------------------------------------------------------------------------
CREATE TABLE "EmailVerificationToken" (
  "id"         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16))) || lower(hex(randomblob(16)))) ,
  "userId"     TEXT NOT NULL UNIQUE,
  "tokenHash"  TEXT NOT NULL UNIQUE,
  "expiresAt"  DATETIME NOT NULL,
  "used"       BOOLEAN NOT NULL DEFAULT 0,
  "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX "EmailVerificationToken_userId_used_idx"     ON "EmailVerificationToken"("userId", "used");
CREATE INDEX "EmailVerificationToken_expiresAt_idx"       ON "EmailVerificationToken"("expiresAt");
-- Partial unique index: at most one ACTIVE (used=false) verification token per user.
CREATE UNIQUE INDEX "EmailVerificationToken_userId_unused_idx"
  ON "EmailVerificationToken"("userId") WHERE "used" = 0;
