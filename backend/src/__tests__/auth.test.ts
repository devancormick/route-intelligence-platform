import request from 'supertest';
import app from '../index';

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new operator', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Operator',
          email: `test${Date.now()}@example.com`,
          password: 'password123',
          phone: '1234567890',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('operator');
      expect(response.body.operator).toHaveProperty('id');
    });

    it('should reject duplicate email', async () => {
      const email = `test${Date.now()}@example.com`;
      
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Operator',
          email,
          password: 'password123',
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Operator 2',
          email,
          password: 'password123',
        });

      expect(response.status).toBe(409);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Operator',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const email = `test${Date.now()}@example.com`;
      const password = 'password123';

      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Operator',
          email,
          password,
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });
  });
});
