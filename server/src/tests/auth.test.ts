// Vitest globals enabled in vitest.config.ts
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/prisma.js';

describe('Village1 Authentication & Access Control Integration Tests', () => {
  const testCustomer = {
    email: `test_user_${Date.now()}@village1.in`,
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'SecurePassword@123',
    fullName: 'Anitha Sundaram',
    village: 'Alanganallur',
    district: 'Madurai',
    pinCode: '625501',
    role: 'CUSTOMER',
  };

  let accessToken: string;
  let refreshToken: string;

  afterAll(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'test_user_' } },
    });
  });

  describe('1. Health Check', () => {
    it('GET /api/v1/health should return 200 with platform status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.platform).toBe('Village1');
    });
  });

  describe('2. User Registration', () => {
    it('POST /api/v1/auth/register should successfully register a new customer', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testCustomer);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testCustomer.email.toLowerCase());
      expect(res.body.data.user.customerProfile.village).toBe(testCustomer.village);
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');

      // Save tokens for subsequent tests
      accessToken = res.body.data.tokens.accessToken;
      refreshToken = res.body.data.tokens.refreshToken;
    });

    it('POST /api/v1/auth/register should prevent duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testCustomer,
          phone: '9789012345', // Different phone
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('POST /api/v1/auth/register should reject weak passwords', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testCustomer,
          email: 'weak_pwd@village1.in',
          phone: '9789012346',
          password: 'weak', // no uppercase, number, symbol
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/auth/register should reject attempt to register as ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testCustomer,
          email: 'fake_admin@village1.in',
          phone: '9789012347',
          role: 'ADMIN',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. User Login', () => {
    it('POST /api/v1/auth/login should log in with valid email and password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testCustomer.email,
          password: testCustomer.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testCustomer.email.toLowerCase());
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('POST /api/v1/auth/login should log in with valid phone and password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testCustomer.phone,
          password: testCustomer.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.phone).toBe(testCustomer.phone);
    });

    it('POST /api/v1/auth/login should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testCustomer.email,
          password: 'WrongPassword@999',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('POST /api/v1/auth/login should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'ghost@village1.in',
          password: 'SomePassword@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/login should successfully authenticate seeded ADMIN account', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'admin@village1.in',
          password: 'AdminSecure@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ADMIN');
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('POST /api/v1/auth/login should successfully authenticate seeded SHOPKEEPER account', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'shopkeeper@village1.in',
          password: 'Shopkeeper@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('SHOPKEEPER');
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('POST /api/v1/auth/login should successfully authenticate seeded CUSTOMER account', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'customer@village1.in',
          password: 'Customer@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });
  });

  describe('4. Protected Routes & User Profile', () => {
    it('GET /api/v1/auth/me should return user details with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testCustomer.email.toLowerCase());
      expect(res.body.data.user.customerProfile.village).toBe(testCustomer.village);
    });

    it('GET /api/v1/auth/me should reject request without Authorization header', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/auth/me should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_bogus_token_123');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('5. Refresh Token Rotation', () => {
    it('POST /api/v1/auth/refresh should rotate token and return new access token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      // Update tokens
      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('POST /api/v1/auth/refresh should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'non_existent_refresh_token_string' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('6. User Address Management', () => {
    let addressId: string;

    it('POST /api/v1/users/addresses should add a new delivery address', async () => {
      const res = await request(app)
        .post('/api/v1/users/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          addressLine: '45, North Street',
          village: 'Alanganallur',
          district: 'Madurai',
          state: 'Tamil Nadu',
          pinCode: '625501',
          landmark: 'Opposite Primary Health Centre',
          isDefault: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.address.village).toBe('Alanganallur');
      addressId = res.body.data.address.id;
    });

    it('GET /api/v1/users/addresses should list user addresses', async () => {
      const res = await request(app)
        .get('/api/v1/users/addresses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.addresses)).toBe(true);
      expect(res.body.data.addresses.length).toBeGreaterThanOrEqual(1);
    });

    it('DELETE /api/v1/users/addresses/:id should delete an address', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/addresses/${addressId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('7. Logout Session Invalidation', () => {
    it('POST /api/v1/auth/logout should revoke active refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('8. Rate Limiter Configuration and Route Separation', () => {
    it('generalLimiter should skip auth endpoints and allow dedicated authLimiter handling', async () => {
      // Multiple consecutive requests to /auth/login must succeed without hitting generalLimiter
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            identifier: 'customer@village1.in',
            password: 'Customer@123',
          });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });

    it('health endpoint should be accessible and return valid response', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
