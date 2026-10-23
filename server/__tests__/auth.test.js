const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/index');
const User = require('../../src/models/User');

const TEST_DB = 'mongodb://127.0.0.1:27017/fitlife_test';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_for_testing';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB);
  }
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/register', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  it('should register a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('_id');
    expect(res.body.user.email).toBe(validUser.email.toLowerCase());
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should not allow duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('should reject registration with invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validUser,
      email: 'not-an-email',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('should reject registration with short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...validUser,
      password: '123',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject registration with missing name', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: validUser.email,
      password: validUser.password,
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'login@example.com',
      password: 'password123',
    });
  });

  it('should login with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'password123',
    });
    expect(res.statusCode).toBe(401);
  });

  it('should reject login with missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Me User',
      email: 'me@example.com',
      password: 'password123',
    });
    token = res.body.token;
  });

  it('should return user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('me@example.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('should reject request with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.statusCode).toBe(401);
  });
});
