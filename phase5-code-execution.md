# Phase 5 — Async Code-Execution Pipeline (v0.12.0-phase5)

Turns submission grading into a durable, observable, at-least-once async pipeline.
**Strictly additive**: the synchronous inline fallback remains the default when Redis
is unreachable, all existing API shapes are unchanged, and no frontend change was
required.

---

## 1. What was built

| Requirement | Where | How |
|---|---|---|
| Submission queue | `server/src/queues/queueService.ts` | `enqueueSubmission()` dedupes on `submissionId` (BullMQ jobId) — a retried enqueue never double-runs |
| 3-stage pipeline | `server/src/worker/processSubmission.ts`, `processEvaluation.ts`, `processResult.ts` | `code-submission` → `code-evaluation` → `result-processing`; stage jobIds `evaluation-${id}` / `result-${id}` (BullMQ v5 rejects `:` in custom jobIds — fixed after the first real-Redis run) |
| DLQs | same workers + `server/src/worker/index.ts` | Per-stage DLQs (`*-dlq`) with `originalQueue` metadata; retry-exhausted jobs route there via `moveToFailed` |
| Idempotent grading | `processResult.ts` | `xpAwarded` flag + dedupe on submissionId — XP awarded exactly once even if the result job is retried |
| Judge0 abstraction | `server/src/integrations/judge0/` | `Judge0Provider` (CE/extra/self API versions, auth header/bearer/none, poll mode, languages cache); injectable for tests |
| Heartbeats | `server/src/worker/heartbeat.ts` | Worker writes `{ pid, stage, currentJobId, processed, startedAt }` to Redis at `WORKER_HEARTBEAT_INTERVAL_MS` (default 10s) |
| Admin monitoring | `server/src/controllers/codingMonitoringController.ts` | Queue status (6 queues), worker heartbeats, requeue-failed — all behind `requireRole(['ADMIN'])` |
| Inline fallback | `queueService.ts` | Redis unreachable (or ping cached unhealthy) → synchronous inline grading; result shape identical to the async path |
| Idle/retry config | `server/src/config/index.ts` | `QUEUE_JOB_MAX_DURATION_MS` (5 min watchdog), attempts/backoff via BullMQ defaults, `REDIS_URL`, `QUEUE_PREFIX` |
| Testing | `server/__tests__/coding.redis.integration.test.ts` (6 tests) + `coding.live.judge0.test.ts` (7 tests) | Real BullMQ + real Redis (flush-isolated) end-to-end pipeline, dedupe, DLQ routing, requeue, metrics, heartbeats; live Judge0 status/verdict mapping |

## 2. Admin endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/code/queue` | Per-queue waiting/active/completed/failed/delayed counts + Redis reachability |
| GET | `/api/admin/code/worker` | Live worker heartbeats (pid, stage, current job, processed count) |
| POST | `/api/admin/code/queue/requeue-failed` | Requeue failed jobs from a named queue (admin retry) |

All behind `authMiddleware` + `requireRole(['ADMIN'])`.

## 3. Queue/job model

- `code-submission`, `code-evaluation`, `result-processing` (+ 3 matching DLQs).
- Job names: `submission.run`, `evaluation.run`, `result.apply`, `dlq.retain`.
- Dedup: `enqueueSubmission` passes `jobId: submissionId` → BullMQ at-least-once semantics.
- Failure routing: stage failures exhaust attempts → `*-dlq` with `originalQueue` + `originalJobId`.

## 4. Verification

- `npx jest` → **10 suites passed, 3 skipped (gated); 133 passed, 18 skipped, 151 total**
- Redis integration suite (run with `RUN_REDIS_TESTS=true` + reachable `REDIS_URL`): **6/6** —
  full pipeline + XP-once, dedupe on retried enqueue, DLQ routing, requeue, metrics, heartbeats
- `npx tsc --noEmit` clean; `npm run build` clean
- `prisma validate` clean for both `schema.prisma` (PG) and `schema.sqlite.prisma`
- Live Judge0 suite gated behind `RUN_LIVE_JUDGE0_TESTS=true` (needs a local Judge0 runner,
  see `docker compose --profile judge0 up -d` + `JUDGE0_API_URL`/`JUDGE0_AUTH_TYPE=none`)

## 5. Ops notes & known limits

- **Render worker service**: `npm run worker` (starts `dist/worker/index.js`) must run as a
  separate process from the API so Redis-gated processing happens. Deploy it with `REDIS_URL`
  configured; it degrades to inline grading only inside the API process, not the worker.
- **Real Redis only surfaced the BullMQ `:` jobId rejection** and the cross-run jobId
  dedup trap — the integration suite flushes Redis in `beforeAll` and uses unique `redis-*`
  ids to stay hermetic.
- **Leaderboards / XP reward are still stubbed** outside the submission row (`xpAwarded`
  flag is written; leaderboard/notification updates remain a follow-up).
- **Status report follow-ups** (from `phase4` doc): keep `api.md` and `deployment.md` in sync
  with the new `/api/admin/code/*` endpoints and worker env vars.
- Heartbeat is Redis-backed: if Redis is down the API's `getWorkerStatus` reports
  `redisReachable: false` rather than failing.
- The pipeline's inline fallback is per-process; enqueuing to a queue while Redis is
  unhealthy uses a 5s ping cache (`queueService.ts`) — re-checked on each enqueue attempt.
