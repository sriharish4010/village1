// Vitest globals enabled in vitest.config.ts
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/prisma.js';

describe('Village1 Phase 2: Shop Management & Super Admin Authorization Tests', () => {
  let adminToken: string;
  let shopkeeperToken: string;
  let customerToken: string;
  let testCategoryId: string;
  let createdShopId: string;

  beforeAll(async () => {
    // 1. Fetch category
    const cat = await prisma.shopCategory.findFirst({
      where: { slug: 'grocery-stores' },
    });
    if (cat) {
      testCategoryId = cat.id;
    } else {
      const newCat = await prisma.shopCategory.create({
        data: { name: 'Grocery Stores', slug: 'grocery-stores', icon: '🛒' },
      });
      testCategoryId = newCat.id;
    }

    // 2. Login Admin
    const adminRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin@village1.in',
      password: 'AdminSecure@123',
    });
    adminToken = adminRes.body.data.tokens.accessToken;

    // 3. Login Shopkeeper
    const shopkeeperRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'shopkeeper@village1.in',
      password: 'Shopkeeper@123',
    });
    shopkeeperToken = shopkeeperRes.body.data.tokens.accessToken;

    // 4. Login Customer
    const customerRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer@village1.in',
      password: 'Customer@123',
    });
    customerToken = customerRes.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test shop if created
    if (createdShopId) {
      await prisma.shop.deleteMany({ where: { id: createdShopId } });
    }
  });

  describe('1. Admin API Authorization & RBAC Enforcement', () => {
    it('GET /api/v1/admin/stats should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/admin/stats');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/admin/stats should reject Customers with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('GET /api/v1/admin/stats should reject Shopkeepers with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${shopkeeperToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('GET /api/v1/admin/stats should allow Admins and return genuine database statistics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toHaveProperty('users');
      expect(res.body.data.stats.users.total).toBeGreaterThanOrEqual(3);
      expect(res.body.data.stats).toHaveProperty('shops');
      expect(res.body.data.stats.shops.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.stats.revenue.status).toBe('NOT_CONFIGURED'); // Strictly un-fabricated!
    });
  });

  describe('2. Shop Registration & Status Lifecycle', () => {
    it('POST /api/v1/shops should allow shopkeeper to register a shop in PENDING status', async () => {
      const res = await request(app)
        .post('/api/v1/shops')
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({
          name: 'Meenakshi Provisions & Dairy',
          categoryId: testCategoryId,
          description: 'Traditional village grocery store and daily milk provisions.',
          address: '42, West Street',
          village: 'Alanganallur',
          district: 'Madurai',
          state: 'Tamil Nadu',
          pinCode: '625501',
          phone: '9876543210',
          openingHours: '07:00',
          closingHours: '21:00',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shop.name).toBe('Meenakshi Provisions & Dairy');
      expect(res.body.data.shop.verificationStatus).toBe('PENDING');
      expect(res.body.data.shop.isActive).toBe(false); // Inactive until approved

      createdShopId = res.body.data.shop.id;
    });

    it('GET /api/v1/shops/public should NOT list unapproved PENDING shops', async () => {
      const res = await request(app)
        .get('/api/v1/shops/public')
        .query({ search: 'Meenakshi Provisions' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.data.shops.find((s: any) => s.id === createdShopId);
      expect(found).toBeUndefined(); // Must not be visible publicly
    });

    it('PUT /api/v1/admin/shops/:id/approve should reject approval attempts by Customers (403)', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/shops/${createdShopId}/approve`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('PUT /api/v1/admin/shops/:id/approve should allow Admin to approve the shop', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/shops/${createdShopId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shop.verificationStatus).toBe('APPROVED');
      expect(res.body.data.shop.isActive).toBe(true);
    });

    it('GET /api/v1/shops/public should now include the newly approved shop', async () => {
      const res = await request(app)
        .get('/api/v1/shops/public')
        .query({ search: 'Meenakshi Provisions' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.data.shops.find((s: any) => s.id === createdShopId);
      expect(found).toBeDefined();
      expect(found.verificationStatus).toBe('APPROVED');
    });

    it('PUT /api/v1/admin/shops/:id/suspend should suspend the shop with a reason', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/shops/${createdShopId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Audit verification of sanitary conditions.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shop.verificationStatus).toBe('SUSPENDED');
      expect(res.body.data.shop.isActive).toBe(false);
    });

    it('GET /api/v1/shops/public should NOT list suspended shops', async () => {
      const res = await request(app)
        .get('/api/v1/shops/public')
        .query({ search: 'Meenakshi Provisions' });

      expect(res.status).toBe(200);
      const found = res.body.data.shops.find((s: any) => s.id === createdShopId);
      expect(found).toBeUndefined();
    });

    it('PUT /api/v1/admin/shops/:id/reactivate should reactivate the suspended shop', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/shops/${createdShopId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.shop.verificationStatus).toBe('APPROVED');
      expect(res.body.data.shop.isActive).toBe(true);
    });
  });

  describe('3. Admin User Management & Safety Guards', () => {
    it('GET /api/v1/admin/users should return searchable user list with role filters', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .query({ role: 'CUSTOMER' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.users[0].role).toBe('CUSTOMER');
    });

    it('PUT /api/v1/admin/users/:id/status should prevent Admin from deactivating their own account', async () => {
      // Find admin's user ID
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      const adminId = meRes.body.data.user.id;

      const res = await request(app)
        .put(`/api/v1/admin/users/${adminId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false,
          reason: 'Attempted self-deactivation test',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SELF_DEACTIVATION_NOT_ALLOWED');
    });
  });

  describe('4. Audit Logging Verification', () => {
    it('GET /api/v1/admin/audit-logs should record all admin operations with actor and action', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.logs.length).toBeGreaterThanOrEqual(1);

      // Verify that SHOP_APPROVED and SHOP_SUSPENDED appear in audit logs
      const actions = res.body.data.logs.map((l: any) => l.action);
      expect(actions).toContain('SHOP_APPROVED');
      expect(actions).toContain('SHOP_SUSPENDED');
    });
  });
});
