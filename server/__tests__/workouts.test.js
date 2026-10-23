const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/index');
const User = require('../../src/models/User');
const Workout = require('../../src/models/Workout');

const TEST_DB = 'mongodb://127.0.0.1:27017/fitlife_test';

let token, token2, userId, userId2;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_for_testing';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB);
  }

  // Create two users for authorization tests
  const res1 = await request(app).post('/api/auth/register').send({
    name: 'User One',
    email: 'user1@example.com',
    password: 'password123',
  });
  token = res1.body.token;
  userId = res1.body.user._id;

  const res2 = await request(app).post('/api/auth/register').send({
    name: 'User Two',
    email: 'user2@example.com',
    password: 'password123',
  });
  token2 = res2.body.token;
  userId2 = res2.body.user._id;
});

afterAll(async () => {
  await Workout.deleteMany({});
  await User.deleteMany({});
  await mongoose.disconnect();
});

afterEach(async () => {
  await Workout.deleteMany({});
});

describe('POST /api/workouts', () => {
  it('should create a workout for authenticated user', async () => {
    const res = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Morning Push Day',
        duration: 60,
        type: 'strength',
        caloriesBurned: 300,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.workout.title).toBe('Morning Push Day');
    expect(res.body.workout.user).toBe(userId);
  });

  it('should reject workout creation without auth', async () => {
    const res = await request(app).post('/api/workouts').send({
      title: 'Test',
      duration: 30,
    });
    expect(res.statusCode).toBe(401);
  });

  it('should reject workout without required fields', async () => {
    const res = await request(app)
      .post('/api/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'cardio' });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/workouts', () => {
  beforeEach(async () => {
    await Workout.create([
      { user: userId, title: 'Workout A', duration: 45, type: 'strength', date: new Date() },
      { user: userId, title: 'Workout B', duration: 30, type: 'cardio', date: new Date() },
      { user: userId2, title: 'Other User Workout', duration: 60, type: 'strength', date: new Date() },
    ]);
  });

  it('should return only the authenticated user\'s workouts', async () => {
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.workouts.length).toBe(2);
    res.body.workouts.forEach((w) => expect(w.user).toBe(userId));
  });

  it('should not return other user\'s workouts', async () => {
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', `Bearer ${token2}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.workouts.length).toBe(1);
    expect(res.body.workouts[0].title).toBe('Other User Workout');
  });
});

describe('PATCH /api/workouts/:id', () => {
  let workoutId;

  beforeEach(async () => {
    const workout = await Workout.create({
      user: userId,
      title: 'Original Title',
      duration: 45,
      date: new Date(),
    });
    workoutId = workout._id.toString();
  });

  it('should update own workout', async () => {
    const res = await request(app)
      .patch(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title', duration: 60 });

    expect(res.statusCode).toBe(200);
    expect(res.body.workout.title).toBe('Updated Title');
  });

  it('should not allow user to update another user\'s workout', async () => {
    const res = await request(app)
      .patch(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Hacked Title' });

    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/workouts/:id', () => {
  let workoutId;

  beforeEach(async () => {
    const workout = await Workout.create({
      user: userId,
      title: 'To Delete',
      duration: 30,
      date: new Date(),
    });
    workoutId = workout._id.toString();
  });

  it('should delete own workout', async () => {
    const res = await request(app)
      .delete(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const check = await Workout.findById(workoutId);
    expect(check).toBeNull();
  });

  it('should not allow deletion of another user\'s workout', async () => {
    const res = await request(app)
      .delete(`/api/workouts/${workoutId}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(res.statusCode).toBe(404);
    const check = await Workout.findById(workoutId);
    expect(check).not.toBeNull();
  });
});
