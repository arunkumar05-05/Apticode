/**
 * Profile update validation tests (supertest against the real app).
 *
 * PUT /api/profile is now gated by profileUpdateSchema: required fields must
 * be present and valid, optional URL fields accept '' as absent, and unknown
 * keys (e.g. email) are stripped rather than persisted.
 */
import request from 'supertest';
import { app } from '../src/index';

const validPayload = {
  fullName: 'Rahul Sharma',
  phone: '9876543210',
  college: 'AptiCode College',
  branch: 'Computer Science',
  graduationYear: 2026,
  registerNumber: '22CS001',
  skills: 'Python, React',
  bio: 'Placement aspirant'
};

describe('Profile update validation', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@college.edu', password: 'StudentPassword2026!' });
    expect(res.status).toBe(200);
    token = res.body.token;
  });

  it('rejects PUT /api/profile without a token (401)', async () => {
    const res = await request(app)
      .put('/api/profile')
      .send(validPayload);
    expect(res.status).toBe(401);
  });

  it('persists a complete valid payload (200) with default readiness index', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.profile.phone).toBe('9876543210');
    expect(res.body.profile.college).toBe('AptiCode College');
    expect(res.body.profile.branch).toBe('Computer Science');
    expect(res.body.profile.registerNumber).toBe('22CS001');
    expect(res.body.profile.skills).toBe('Python, React');
    expect(res.body.profile.placementReadinessIndex).toBe(70);
  });

  it('rejects a payload missing phone (400 with a phone field error)', async () => {
    const { phone, ...rest } = validPayload;
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(rest);
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toBe('Invalid profile payload');
    expect(res.body.errors.some((e: any) => e.field === 'phone')).toBe(true);
  });

  it('rejects an invalid phone (400)', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, phone: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e: any) => e.field === 'phone')).toBe(true);
  });

  it.each([1900, 2100])('rejects out-of-range graduationYear %d (400)', async (year) => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, graduationYear: year });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e: any) => e.field === 'graduationYear')).toBe(true);
  });

  it('rejects an invalid github URL (400)', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, github: 'not-a-url' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e: any) => e.field === 'github')).toBe(true);
  });

  it('accepts empty optional link fields (200)', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, github: '', linkedin: '', portfolio: '' });
    expect(res.status).toBe(200);
  });

  it('ignores unknown keys and persists a valid email', async () => {
    // 'email' is validated-optional: junk is rejected, a valid email lands on
    // the Profile row (the service persists it), unknown keys stay stripped.
    const junk = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, email: 'not-an-email' });
    expect(junk.status).toBe(400);
    expect(junk.body.errors.some((e: any) => e.field === 'email')).toBe(true);

    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, email: 'profile-owner@test.dev' });
    expect(res.status).toBe(200);
    expect(res.body.profile.email).toBe('profile-owner@test.dev');
  });

  it('coerces string graduationYear into an integer (200)', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, graduationYear: '2026' });
    expect(res.status).toBe(200);
    expect(res.body.profile.graduationYear).toBe(2026);
  });

  it('rejects a too-short fullName (400 with a fullName field error)', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, fullName: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e: any) => e.field === 'fullName')).toBe(true);
  });

  it('rejects an invalid registerNumber (400)', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, registerNumber: 'x!' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e: any) => e.field === 'registerNumber')).toBe(true);
  });

  it('accepts an empty bio (200)', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, bio: '' });
    expect(res.status).toBe(200);
  });

  it('returns the persisted required fields via GET /api/profile (200)', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    const profile = res.body.profile;
    expect(profile.phone).toBe('9876543210');
    expect(profile.college).toBe('AptiCode College');
    expect(profile.branch).toBe('Computer Science');
    expect(profile.registerNumber).toBe('22CS001');
    expect(profile.skills).toBe('Python, React');
  });
});
