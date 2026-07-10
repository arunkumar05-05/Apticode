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

## 📄 License

Proprietary — All rights reserved (update per your organization's licensing terms).

---

## 🤝 Contributing

See [`engineering.md`](./engineering.md) for branching strategy, commit conventions, and code review checklist.
