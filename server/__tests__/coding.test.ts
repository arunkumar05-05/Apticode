import request from 'supertest';
import { app } from '../src/index';

describe('Coding Routes', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@college.edu', password: 'StudentPassword2026!' });
    token = res.body.token;
  });

  describe('GET /api/coding/challenges', () => {
    it('should return challenges list', async () => {
      const res = await request(app)
        .get('/api/coding/challenges')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.challenges)).toBe(true);
    });
  });

  describe('POST /api/coding/challenges (admin CMS)', () => {
    let adminToken: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@college.edu', password: 'AdminPassword2026!' });
      adminToken = res.body.token;
    });

    it('should create a challenge', async () => {
      const res = await request(app)
        .post('/api/coding/challenges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Challenge',
          description: 'A test challenge',
          difficulty: 'EASY',
          timeLimitMs: 5000,
          testcases: [
            { inputData: 'input', expectedOutput: 'output', isHidden: false }
          ]
        });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.title).toBe('Test Challenge');
    });
  });

  describe('POST /api/coding/submissions', () => {
    it('should submit code', async () => {
      const res = await request(app)
        .post('/api/coding/submissions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          problemTitle: 'Two Sum',
          code: 'function twoSum(nums, target) { return [0,1]; }',
          language: 'javascript'
        });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.submission).toBeDefined();
    });
  });

  describe('GET /api/coding/submissions', () => {
    it('should return submission history', async () => {
      const res = await request(app)
        .get('/api/coding/submissions')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.history)).toBe(true);
    });
  });
});