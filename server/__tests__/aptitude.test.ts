import request from 'supertest';
import { app } from '../src/index';

describe('Aptitude Routes', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@college.edu', password: 'StudentPassword2026!' });
    token = res.body.token;
  });

  describe('GET /api/topics', () => {
    it('should return topics with options array', async () => {
      const res = await request(app)
        .get('/api/topics')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data || res.body.topics)).toBe(true);
    });
  });

  describe('POST /api/mcqs/progress', () => {
    it('should save an attempt', async () => {
      const res = await request(app)
        .post('/api/mcqs/progress')
        .set('Authorization', `Bearer ${token}`)
        .send({
          topicId: 'q1',
          score: 50,
          accuracy: 0.5,
          timeTaken: 120,
          incorrectQuestions: [],
          topicPerformance: {}
        });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });

  describe('GET /api/mcqs/progress', () => {
    it('should return attempt history', async () => {
      const res = await request(app)
        .get('/api/mcqs/progress')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });

  describe('MCQ CRUD (admin)', () => {
    let adminToken: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@college.edu', password: 'AdminPassword2026!' });
      adminToken = res.body.token;
    });

    it('POST /api/mcqs should create a question', async () => {
      const res = await request(app)
        .post('/api/mcqs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          topicId: 'q1',
          questionText: 'Test question?',
          options: ['A', 'B', 'C', 'D'],
          correctIndex: 0,
          explanation: 'Test explanation',
          difficulty: 'EASY'
        });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();
    });

    it('GET /api/mcqs should list questions', async () => {
      const res = await request(app)
        .get('/api/mcqs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});