import request from 'supertest';
import { app } from '../src/index';

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@test.com',
          password: 'TestPassword123!',
          fullName: 'Test User',
          role: 'STUDENT'
        });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('testuser@test.com');
    });

    it('should return 409 for duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@test.com',
          password: 'TestPassword123!',
          fullName: 'Test User',
          role: 'STUDENT'
        });
      expect(res.status).toBe(409);
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@college.edu', password: 'StudentPassword2026!' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@college.edu', password: 'WrongPassword!' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 400 without refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return success', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'fake-token' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });
});