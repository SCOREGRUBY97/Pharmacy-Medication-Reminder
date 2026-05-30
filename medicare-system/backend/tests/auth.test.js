// ============================================================
// TEST PLAN — SRS Section 12: Auth & Medication Tests
// ============================================================
const request = require('supertest');
const app = require('../src/server');

// Mock DB pool to avoid real DB calls in tests
jest.mock('../src/config/db', () => ({
  query: jest.fn(),
}));

const pool = require('../src/config/db');

describe('Auth API', () => {

  // TC01 — Register with valid details
  test('POST /api/auth/register — success', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })            // email not exists
      .mockResolvedValueOnce({ rows: [{               // insert user
        user_id: 1, full_name: 'Test User',
        email: 'test@test.com', role: 'patient',
        date_created: new Date(),
      }] });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Test User',
        email: 'test@test.com',
        password: 'Password123',
        role: 'patient',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  // TC02 — Login with invalid credentials
  test('POST /api/auth/login — invalid credentials', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // user not found

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'wrongpass' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });

  // TC07 — Unauthorized access to protected route
  test('GET /api/medicines — without token returns 401', async () => {
    const res = await request(app).get('/api/medicines');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Validation — missing required fields
  test('POST /api/auth/register — missing email returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Test', password: 'pass123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

});

describe('Medication API', () => {

  // TC03 — Add medication with valid data
  test('POST /api/medicines — stores medication correctly', async () => {
    // Mock JWT verify
    jest.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue({ userId: 1 });

    pool.query
      .mockResolvedValueOnce({ rows: [{ user_id: 1, role: 'patient', is_active: true, full_name: 'Test' }] }) // auth
      .mockResolvedValueOnce({ rows: [{ medication_id: 1, medication_name: 'Metformin' }] }) // insert
      .mockResolvedValueOnce({ rows: [] }); // reminder insert

    const res = await request(app)
      .post('/api/medicines')
      .set('Authorization', 'Bearer mock_token')
      .send({
        medication_name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        times: ['08:00', '20:00'],
        start_date: '2026-05-01',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

});

describe('Health Check', () => {
  test('GET /health — returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/running/i);
  });
});
