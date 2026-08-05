-- Phase 2: production read performance indexes.
--
-- ADDITIVE ONLY — no tables/fields added or removed.
-- Portable across PostgreSQL (>= 9.5) and SQLite (both support
-- CREATE INDEX IF NOT EXISTS and single-column + composite indexes).
-- Idempotent: safe to run multiple times.
--
-- Indexes reflect the @@index blocks added in prisma/schema.prisma.
-- Each index is documented at prisma/migrations/README.md (Phase 2 report).

-- RefreshToken: lookups by user + expiry sweep
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken" ("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_expiresAt_idx" ON "RefreshToken" ("expiresAt");

-- AptitudeQuestion: filter by topic + difficulty, recency
CREATE INDEX IF NOT EXISTS "AptitudeQuestion_topicId_difficulty_idx" ON "AptitudeQuestion" ("topicId", "difficulty");
CREATE INDEX IF NOT EXISTS "AptitudeQuestion_createdAt_idx" ON "AptitudeQuestion" ("createdAt");

-- UserAttempt: per-user history + per-topic analytics
CREATE INDEX IF NOT EXISTS "UserAttempt_userId_completedAt_idx" ON "UserAttempt" ("userId", "completedAt");
CREATE INDEX IF NOT EXISTS "UserAttempt_topicId_completedAt_idx" ON "UserAttempt" ("topicId", "completedAt");

-- CodingSubmission: user submission history + per-problem status board
CREATE INDEX IF NOT EXISTS "CodingSubmission_userId_createdAt_idx" ON "CodingSubmission" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "CodingSubmission_problemId_status_idx" ON "CodingSubmission" ("problemId", "status");

-- CommunicationSession: per-user session history + type analytics
CREATE INDEX IF NOT EXISTS "CommunicationSession_userId_createdAt_idx" ON "CommunicationSession" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "CommunicationSession_sessionType_idx" ON "CommunicationSession" ("sessionType");

-- MockInterview: per-user interview history + type analytics
CREATE INDEX IF NOT EXISTS "MockInterview_userId_createdAt_idx" ON "MockInterview" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "MockInterview_interviewType_idx" ON "MockInterview" ("interviewType");

-- InterviewMessage: message timeline within an interview
CREATE INDEX IF NOT EXISTS "InterviewMessage_interviewId_createdAt_idx" ON "InterviewMessage" ("interviewId", "createdAt");

-- Resume: per-user resume versions + leaderboard scoring
CREATE INDEX IF NOT EXISTS "Resume_userId_createdAt_idx" ON "Resume" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Resume_atsScore_idx" ON "Resume" ("atsScore");
