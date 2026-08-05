import request from 'supertest';
import { app } from '../src/index';
import { db } from '../src/prisma/db';

describe('Leaderboard Routes (Phase 2 read-path)', () => {
  let token: string;
  let studentId: string;

  beforeAll(async () => {
    // Auto-provisions 'student@college.edu' (Rahul Sharma) via auth login.
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@college.edu', password: 'StudentPassword2026!' });
    token = res.body.token;

    studentId = (await db.user.findUnique({ where: { email: 'student@college.edu' } }))!.id;

    // Seed Leaderboard rows for the indexed read-path. Upsert so the test is
    // idempotent across repeated jest runs on the in-memory store.
    await db.leaderboard.upsert({
      where: { userId: studentId },
      update: { totalXp: 28400 },
      create: { userId: studentId, totalXp: 28400 },
    });

    const makeRunner = async (email: string, totalXp: number) => {
      const u = await db.user.upsert({
        where: { email },
        update: {},
        create: { email, fullName: email.split('@')[0], role: 'STUDENT', passwordHash: 'x' },
      });
      await db.leaderboard.upsert({ where: { userId: u.id }, update: { totalXp }, create: { userId: u.id, totalXp } });
    };
    await makeRunner('runner-up-a@college.edu', 12000);
    await makeRunner('runner-up-b@college.edu', 10000);
  });

  it('GET /api/leaderboard returns ranked standings with "(You)" marker', async () => {
    const res = await request(app)
      .get('/api/leaderboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    const standings = res.body.standings;
    expect(Array.isArray(standings)).toBe(true);
    expect(standings.length).toBeGreaterThanOrEqual(3);

    // Sorted by totalXp DESC → student (you) first.
    expect(standings[0].rank).toBe(1);
    expect(standings[0].totalScore).toBe(28400);
    expect(standings[0].name).toBe('Rahul Sharma (You)');
    expect(standings[0].userId).toBe(studentId);

    // Descending order check across the top entries.
    expect(standings[1].totalScore).toBeLessThanOrEqual(standings[0].totalScore);
    expect(standings[2].totalScore).toBeLessThanOrEqual(standings[1].totalScore);

    // Phase 2 guarantee: no attempt arrays / profile blobs leak into payload.
    const payload = JSON.stringify(res.body);
    expect(payload).not.toContain('codingAttempts');
    expect(payload).not.toContain('aptitudeAttempts');
  });

  it('marks the requesting user exactly once', async () => {
    const res = await request(app)
      .get('/api/leaderboard')
      .set('Authorization', `Bearer ${token}`);
    const youCount = res.body.standings.filter((s: any) =>
      String(s.name).endsWith(' (You)')
    ).length;
    expect(youCount).toBe(1);
  });
});
