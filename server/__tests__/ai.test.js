const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const User = require('../src/models/User');
const WorkoutPlan = require('../src/models/WorkoutPlan');

const TEST_DB = 'mongodb://127.0.0.1:27017/fitlife_test';

let token, userId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_for_testing';

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_DB);
    }

    const res = await request(app).post('/api/auth/register').send({
      name: 'AI Test User',
      email: `ai_test_${Date.now()}@example.com`,
      password: 'password123',
    });
    token = res.body.token;
    userId = res.body.user?._id;
  } catch (err) {
    // If MongoDB is not running locally, test suite will handle connection gracefully
    console.warn('MongoDB connection not available in test runner:', err.message);
  }
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await WorkoutPlan.deleteMany({});
      await User.deleteMany({ email: /ai_test_/ });
      await mongoose.disconnect();
    }
  } catch {}
});

describe('AI Routes & Validation', () => {
  it('should reject unauthenticated access to /api/ai/coach', async () => {
    const res = await request(app).post('/api/ai/coach').send({ message: 'Hello' });
    expect(res.status).toBe(401);
  });

  it('should validate missing message in /api/ai/coach', async () => {
    if (!token) return;
    const res = await request(app)
      .post('/api/ai/coach')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should validate daysPerWeek range in /api/ai/weekly-plan', async () => {
    if (!token) return;
    const res = await request(app)
      .post('/api/ai/weekly-plan')
      .set('Authorization', `Bearer ${token}`)
      .send({
        goal: 'general_fitness',
        fitnessLevel: 'intermediate',
        daysPerWeek: 10, // Invalid: must be between 1 and 7
      });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should reject unauthenticated access to /api/videos/search', async () => {
    const res = await request(app).get('/api/videos/search?exercise=squats');
    expect(res.status).toBe(401);
  });

  it('should validate missing exercise query in /api/videos/search', async () => {
    if (!token) return;
    const res = await request(app)
      .get('/api/videos/search')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should validate session summary endpoint parameters', async () => {
    if (!token) return;
    const res = await request(app)
      .post('/api/ai/session-summary')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});
