# AptiCode – Roadmap & Implementation Strategy

This document outlines the 6-month development roadmap, milestone targets, sprint-by-sprint release schedule, resource allocation, and risk management strategies.

---

## 1. Project Phase Timeline

```
Month 1           Month 2           Month 3           Month 4           Month 5           Month 6
  ├─── Phase 1 ─────┼─── Phase 2 ─────┼─── Phase 3 ─────┼─── Phase 4 ─────┼─── Phase 5 ─────┤
  │ (Foundations)   │ (Practice Core) │ (Speech & AI)   │ (Analytics)     │ (Scale & Sec)   │
```

---

## 2. Milestone Breakdowns

### Phase 1: Core Foundation & Security (Month 1)
Establish the system baseline, secure core authentication channels, and provision environments.
* **Milestones**:
  * Set up Monorepo architecture, Docker workspaces, and CI/CD foundations.
  * Initialize PostgreSQL database with tables, indexes, and custom schema triggers.
  * Launch OAuth, JWT Refresh Token logic, Profile setup, and mailer setups.
  * Deploy landing page UI, authentication layouts, and profile configuration views.

### Phase 2: Core Practice Modules (Month 2)
Integrate the standard training frameworks: Aptitude and Coding.
* **Milestones**:
  * Create the Admin CMS panel for managing aptitude topics, notes, and coding challenges.
  * Integrate Monaco Editor wrapper into Next.js and link it to the backend executor.
  * Connect backend compiler services to Judge0 API; support custom and hidden test case validation.
  * Sync YouTube Data API to pull aptitude topic video lectures automatically.

### Phase 3: AI Assistant & Communication Suite (Month 3)
Add complex communication algorithms and artificial intelligence modules.
* **Milestones**:
  * Implement Web Speech API wrapper hook in frontend with visual audio waveforms.
  * Integrate Gemini/OpenAI endpoints for evaluating speech grammar, fluency, and tone.
  * Launch AI Assistant bot to handle step-by-step math answers, coding debugging, and general Q&A.
  * Build the initial AI Mock Interview flow (question loop and evaluation scorecard).

### Phase 4: Resume Builder & Gamification (Month 4)
Roll out professional tools and engagement systems.
* **Milestones**:
  * Launch the ATS-friendly Resume Builder with dynamic JSON editing and client-side PDF export.
  * Connect the AI Resume Auditor service to verify key metrics and suggest career updates.
  * Set up Redis-backed Leaderboard tracking and XP aggregators on PostgreSQL triggers.
  * Release achievements, streaks, and user profile level badges.

### Phase 5: Analytics, Administration & Audits (Month 5 - 6)
Build dashboards, implement enterprise reporting, optimize performance, and scale database systems.
* **Milestones**:
  * Implement the Placement Officer panel containing cohort metrics and CSV/PDF export tools.
  * Perform complete security testing (rate limits, CORS, secure cookies, SQL injection, XSS checks).
  * Run system-wide performance tuning (Redis caching levels, PostgreSQL indexes, connection poolers).
  * Execute load testing (k6 scripts) to simulate 100k concurrent client connections.

---

## 3. Sprint Plan Structure

Each phase is divided into two 2-week sprints.

```
Sprint 1-2: Provision local environment configs, build DB schema migrations, draft endpoints.
Sprint 3-4: Build basic layouts, implement Monaco wrapper, integrate Judge0 compilers.
Sprint 5-6: Integrate Speech API hook, implement speech analysis metrics, hook up Gemini endpoints.
Sprint 7-8: Build resume PDF output modules, construct ATS-check prompt, launch gamification rules.
Sprint 9-10: Connect Chart.js panels, enable excel/pdf exporting options, finalize admin layout.
Sprint 11-12: Launch k6 simulations, configure auto-scaling variables, audit server logs.
```

---

## 4. Risk Mitigation Matrix

| Identified Risk | Severity | Probability | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **High Compiler Execution Costs** | High | High | Limit execution time to 2 seconds max. Queue compiler runs via BullMQ, caching outcomes in Redis using a SHA-256 hash of the submitted code to skip compiling identical code. |
| **Speech recognition browser incompatibility** | Medium | Medium | Web Speech API works natively in Chrome/Safari. Add clear UI notifications prompting students to use supported browsers, and provide a backup keyboard-only typing response option in interviews. |
| **Gemini API token costs & limits** | High | Medium | Implement Redis-based rate limiting per user. Store past question-answer feedbacks so students don't re-trigger LLM evaluation for identical inputs. |
| **Slow report generation under heavy load** | Medium | High | Perform database aggregations asynchronously. Cache dashboard counts using Redis, and compute placement predictions in background jobs rather than in real-time request-response cycles. |
| **Dirty data inputs (XSS in IDE/Resumes)** | High | Low | Validate and sanitize all text inputs on both the frontend and backend using DOMPurify and express-validator before database insertion. |
