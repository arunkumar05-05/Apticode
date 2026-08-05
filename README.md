# AptiCode

**AI-Powered Aptitude & Communication Preparation Platform**

AptiCode is a production-grade learning platform that helps students prepare for placement drives through structured aptitude training, communication skill development, AI-personalized learning plans, and gamified progress tracking.

---

## 🚀 Overview

AptiCode combines curated video content, adaptive quizzes, real-time speech evaluation, and AI-driven recommendations into a single platform that tracks a student's placement readiness end-to-end.

| Module | Purpose |
|---|---|
| Aptitude | Videos, notes, MCQs, timed quizzes covering Quant, Logical Reasoning, Verbal |
| Communication | Grammar exercises, pronunciation practice via Web Speech API |
| Progress Engine | Tracks study time, accuracy, streaks, completion |
| AI Learning Plan | Generates personalized daily/weekly study paths |
| Gamification | XP, badges, leaderboard |
| Admin Panel | Analytics, content management, reporting |

---

## 🏗️ Tech Stack

**Frontend:** React (Vite), TailwindCSS, Redux Toolkit / React Query
**Backend:** Node.js, Express.js
**Database:** PostgreSQL (with Prisma or Sequelize ORM)
**Auth:** JWT + OTP (email/SMS) + Email Verification
**Speech:** Web Speech API (browser-native STT/TTS)
**Video:** YouTube Data API v3 (iframe embed + progress tracking)
**Caching/Queues:** Redis (sessions, rate limiting, background jobs)
**AI Layer:** LLM-based recommendation engine (Claude/OpenAI API)
**Infra:** Docker, Nginx, CI/CD (GitHub Actions), AWS/Render/Railway

---

## 📁 Documentation Index

This repository ships with a full documentation suite. Read in this order:

1. [`product.md`](./product.md) — Product vision, personas, feature specs
2. [`ui.md`](./ui.md) — UI/UX design system, screens, flows
3. [`architecture.md`](./architecture.md) — System architecture, service boundaries
4. [`engineering.md`](./engineering.md) — Coding standards, folder structure, conventions
5. [`database.md`](./database.md) — PostgreSQL schema, ERD, migrations
6. [`api.md`](./api.md) — REST API contract, endpoints, request/response schemas
7. [`roadmap.md`](./roadmap.md) — Phased delivery plan
8. [`testing.md`](./testing.md) — Test strategy, coverage targets, tooling
9. [`deployment.md`](./deployment.md) — CI/CD, environments, infra setup

---

## ⚙️ Quick Start

```bash
# Clone
git clone https://github.com/your-org/apticode.git
cd apticode

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Environment setup
cp .env.example .env
# Fill in DB, JWT, SMTP, YouTube API, AI API keys

# Run database migrations
npm run db:migrate

# Start dev servers
npm run dev        # backend (port 5000)
npm run dev:client # frontend (port 5173)
```

---

## 🔐 Core Features

- **Authentication:** JWT access/refresh tokens, OTP verification, email verification flow, password reset
- **Student Dashboard:** Progress overview, streaks, recommended next steps
- **Aptitude Prep:** Category-wise videos, notes (PDF/markdown), MCQ bank, timed quizzes with instant scoring
- **Communication Prep:** Grammar drills, pronunciation scoring via Web Speech API, fluency feedback
- **YouTube Integration:** Curated playlists, watch-time tracking, completion detection
- **AI Learning Plan:** Adaptive daily targets based on performance gaps
- **Leaderboard & XP:** Weekly/monthly rankings, badge unlocks
- **Admin Analytics:** Cohort performance, content engagement, drop-off reports

---

## 📊 Tracked Metrics

- Study time per session/day/week
- Video completion percentage
- Quiz accuracy (category-wise)
- Communication scores (pronunciation, grammar)
- Daily/weekly streaks
- Composite **Placement Readiness Score**

---

## 🔒 Security Highlights

- Bcrypt/Argon2 password hashing
- JWT with short-lived access tokens + rotating refresh tokens
- Rate limiting on auth endpoints
- Input validation & sanitization (Zod/Joi)
- HTTPS-only, HSTS, CORS whitelisting
- SQL injection protection via parameterized queries/ORM

See [`architecture.md`](./architecture.md) for full security model.

---

## 🏭 Production Operations

### Requirements
- Node.js >= 20
- PostgreSQL >= 14 (production) · SQLite (dev fallback)
- Redis (cache) — Upstash recommended in prod, local docker for dev

### Configuration
All configuration is environment-driven via `server/src/config/index.ts`, **validated at boot**.
The server refuses to start on invalid env (`JWT_SECRET` must be ≥32 chars).

```bash
cp .env.example .env   # then fill in real values
```

Core env vars (`JWT_SECRET`, `DATABASE_URL`, `AI_API_KEY`, `REDIS_URL`, `SMTP_*`, `CLOUDINARY_*` are all optional except `JWT_SECRET`).

### Local development
```bash
# Terminal 1: server (port 5001, SQLite fallback)
cd server && npm run dev

# Terminal 2: client (port 5173)
cd client && npm run dev
```
- Dev server auto-falls back pg → SQLite (`prisma/dev.db`) → in-memory for tests.
- No `DATABASE_URL` set → SQLite is used directly.

### Local production-like (Docker)
```bash
docker compose up --build -d
# server @5001 · postgres @5432 · redis @6379
curl http://localhost:5001/health
```

### Deploy to Render
```bash
# 1. Create a PostgreSQL + Redis add-on on Render, copy the DATABASE_URL into secrets.
# 2. render.yaml wires DATABASE_URL, JWT_SECRET, AI_API_KEY, etc. as secrets.
render deploy --service apticode-api
```

### Deploy frontend (Vercel)
```
# client/vercel.json is already configured for Vite. Connect the client/
# directory to Vercel via the dashboard or: vercel --dir client
```
Set `VITE_API_URL=https://<your-render-service>.onrender.com` in the Vercel dashboard so the client targets the live API.

### Health endpoint
`GET /health` returns reachability + process metrics. Fields are additive and
backward compatible (`status`, `timestamp`, `version` are always present):
```jsonc
{
  "status": "UP",                                  // preserved
  "timestamp": "2026-08-05T08:45:46.767Z",          // preserved
  "version": "1.0.0",                              // preserved
  "database": "pg",                                // preserved
  "databaseReachable": true,                       // preserved
  "databaseProvider": "postgresql",                // added
  "databaseVersion": "PostgreSQL 17.6 ...",        // added
  "migration": { "lastApplied": "...", ... },      // added
  "env": "development",                            // added
  "uptime": 342.7,                                 // added
  "memory": { "rss": 70418432, "heapUsed": ..., "heapTotal": ..., ... } // added
}
```

### CI / CD
`.github/workflows/ci.yml` runs on every push to `main` and PR:
1. `npm ci` (with npm + Prisma engine caching)
2. `prisma validate` + `prisma generate`
3. `tsc --noEmit`
4. `npm run build`
5. `jest --runInBand`
6. Docker image smoke build

CI is gated on all of the above passing before deploy.

### Observability
- **Structured JSON logging** via `pino` (PID, hostname, `x-request-id`).
- **Request IDs**: auto-generated per request (`crypto.randomUUID()`) and
  propagated on every log line for correlation. Disable via `ENABLE_REQUEST_LOGGING=false`.
- **Security headers** (Helmet + HSTS + CSP) and **compression** are on by default;
  auth tokens/passwords/cookies are **never** logged (pino `redact`).
- **Graceful shutdown**: SIGTERM → 30s grace → forced exit (Render/Railway friendly).
- **Rate limits**: auth endpoints 10/min/ip, general API 300/min/ip, AI 20/min/ip.

### Troubleshooting
| Symptom | Likely cause | Fix |
|---|---|---|
| `503 DEGRADED` on `/health` | DB unreachable | Check `DATABASE_URL`; server falls back to SQLite then in-memory |
| `JWT_SECRET must be ≥32 chars` | Boot refused | Generate: `openssl rand -hex 32` |
| `HTTP 402 quota exceeded` (AI endpoints) | vsllm free-tier exhausted | Top up the provider wallet or set a real `GEMINI_API_KEY` |
| Black screen / empty root | Client mount crash | Run `npm run build` in `client`; check browser console for `.toLocaleString` errors (fixed via `xp` guards in AppLayout/DashboardView/Gamified) |
| Tests fail with `Module not found` | Stale lockfile | `rm -rf node_modules server/node_modules && npm ci` in `server` |

## 📄 License

Proprietary — All rights reserved (update per your organization's licensing terms).

---

## 🤝 Contributing

See [`engineering.md`](./engineering.md) for branching strategy, commit conventions, and code review checklist.
