-- Migration: 20260804_backend_hardening
-- Adds missing fields and models for backend hardening
-- Run manually against Supabase PostgreSQL after review

-- 1. Add feedbackReport to MockInterview
ALTER TABLE "MockInterview" ADD COLUMN IF NOT EXISTS "feedbackReport" TEXT;

-- 2. Add language to CodingSubmission (default 'python')
ALTER TABLE "CodingSubmission" ADD COLUMN IF NOT EXISTS "language" VARCHAR(50) DEFAULT 'python';

-- 3. Create XpLog table
CREATE TABLE IF NOT EXISTS "XpLog" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "XpLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "XpLog_userId_createdAt_idx" ON "XpLog"("userId", "createdAt" DESC);

-- 4. Create Leaderboard table (one row per user, upserted on XP changes)
CREATE TABLE IF NOT EXISTS "Leaderboard" (
    "userId" TEXT PRIMARY KEY,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "Leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Leaderboard_totalXp_idx" ON "Leaderboard"("totalXp" DESC);

-- 5. Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);

-- 6. Add relations on User table (implicit via FKs above)
-- The following columns already exist in User: xp, level
-- No ALTER needed; new tables reference User.id

-- Optional: backfill Leaderboard from existing User.xp
-- Run after migration if leaderboard is empty:
-- INSERT INTO "Leaderboard" ("userId", "totalXp", "rank")
-- SELECT "id", "xp", ROW_NUMBER() OVER (ORDER BY "xp" DESC)
-- FROM "User"
-- ON CONFLICT ("userId") DO UPDATE SET "totalXp" = EXCLUDED."totalXp", "updatedAt" = NOW();