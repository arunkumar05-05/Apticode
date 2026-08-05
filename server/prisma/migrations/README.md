# Phase 2 — Production Indexes (additive)

Migration: `20260806_production_indexes`
Direction: **additive only** — no tables/fields added or removed.

## Indexes added
All indexes are also declared via `@@index` in `prisma/schema.prisma` and materialized
in `prisma/migrations/20260806_production_indexes/migration.sql`.

| Table | Column(s) | Reason |
|---|---|---|
| `RefreshToken` | `userId`, `expiresAt` | token lookups by user + expiry sweep for cleanup |
| `AptitudeQuestion` | `topicId, difficulty` | question pool filtering; `createdAt` | recency / pagination |
| `UserAttempt` | `userId, completedAt` | user history feed; `topicId, completedAt` | topic analytics |
| `CodingSubmission` | `userId, createdAt` | submission history; `problemId, status` | status board |
| `CommunicationSession` | `userId, createdAt` | session history; `sessionType` | type analytics |
| `MockInterview` | `userId, createdAt` | interview history; `interviewType` | type analytics |
| `InterviewMessage` | `interviewId, createdAt` | message timeline within an interview |
| `Resume` | `userId, createdAt` | resume version history; `atsScore` | leaderboard scoring |

## Applying
```bash
# PostgreSQL (production) — Render runs this via CI:
npx prisma migrate deploy
# SQLite (development):
npx prisma migrate dev --name production_indexes
```

## Notes
- DDL uses `CREATE INDEX IF NOT EXISTS` — idempotent on both Postgres and SQLite.
- No `DROP` statements; safe to re-run.
- Connection-pool tuning for Postgres is via `DATABASE_URL` params
  (`?connection_limit=N&application_name=apticode-server`) or PgBouncer.
  Optional env overrides: `PGPOOL_MAX_CONNECTIONS`, `PGPOOL_IDLE_TIMEOUT_MS`.
