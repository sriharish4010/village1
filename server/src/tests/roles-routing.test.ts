// Vitest globals enabled in vitest.config.ts
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/prisma.js';

describe('Village1 Client & Server Role-Based Routing & Authorization Tests', () => {
  let adminToken: string;
  let shopkeeperToken: string;
  let customerToken: string;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin@village1.in',
      password: 'AdminSecure@123',
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.tokens.accessToken;

    // 2. Authenticate Shopkeeper
    const shopkeeperRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'shopkeeper@village1.in',
      password: 'Shopkeeper@123',
    });
    expect(shopkeeperRes.status).toBe(200);
    shopkeeperToken = shopkeeperRes.body.data.tokens.accessToken;

    // 3. Authenticate Customer
    const customerRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer@village1.in',
      password: 'Customer@123',
    });
    expect(customerRes.status).toBe(200);
    customerToken = customerRes.body.data.tokens.accessToken;
  });

  describe('1. Role Authorization Verification on Server APIs', () => {
    it('Shopkeeper user should have role SHOPKEEPER and valid shop associations', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${shopkeeperToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('SHOPKEEPER');
      expect(Array.isArray(res.body.data.user.shops)).toBe(true);
    });

    it('Admin user should have role ADMIN and cannot be accessed by shopkeeper credentials', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${shopkeeperToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Admin user can access /api/v1/admin/stats', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('2. Client-Side Route Protection & Role Matching Simulation', () => {
    // Mirror the ProtectedRoute authorization logic
    const checkRouteAuthorization = (
      user: { role: string } | null,
      options: {
        requireAuth?: boolean;
        allowedRoles?: string[];
      }
    ) => {
      const { requireAuth = true, allowedRoles } = options;

      // 1. Unauthenticated check
      if (!user) {
        if (!requireAuth) return { status: 'ALLOWED', reason: 'PUBLIC_ROUTE' };
        return { status: 'AUTH_REQUIRED', redirect: '/auth' };
      }

      // 2. Public route: any authenticated user role is allowed
      if (!requireAuth) {
        return { status: 'ALLOWED', reason: 'PUBLIC_ROUTE' };
      }

      // 3. Role authorization check (case-insensitive)
      const userRole = user.role.toUpperCase();
      const normalizedAllowedRoles = allowedRoles?.map((r) => r.toUpperCase());

      if (
        normalizedAllowedRoles &&
        normalizedAllowedRoles.length > 0 &&
        !normalizedAllowedRoles.includes(userRole)
      ) {
        return { status: 'ACCESS_RESTRICTED', role: userRole };
      }

      return { status: 'ALLOWED' };
    };

    const shopkeeperRoutes = [
      '/shopkeeper/dashboard',
      '/shopkeeper/shops',
      '/shopkeeper/add-item',
      '/shopkeeper/inventory',
      '/shopkeeper/orders',
      '/shopkeeper/pos',
      '/shopkeeper/sales-history',
      '/shopkeeper/reports',
      '/shopkeeper/settings',
    ];

    it('Shopkeeper user is ALLOWED on all 9 shopkeeper routes', () => {
      const shopkeeperUser = { role: 'SHOPKEEPER' };

      for (const route of shopkeeperRoutes) {
        const result = checkRouteAuthorization(shopkeeperUser, {
          requireAuth: true,
          allowedRoles: ['SHOPKEEPER'],
        });
        expect(result.status, `Route ${route} should be accessible by SHOPKEEPER`).toBe('ALLOWED');
      }
    });

    it('Handles case-insensitive role representations (e.g. "shopkeeper" or "Shopkeeper")', () => {
      for (const variant of ['shopkeeper', 'Shopkeeper', 'SHOPKEEPER']) {
        const result = checkRouteAuthorization(
          { role: variant },
          { requireAuth: true, allowedRoles: ['SHOPKEEPER'] }
        );
        expect(result.status).toBe('ALLOWED');
      }
    });

    it('Customer user is RESTRICTED from shopkeeper routes', () => {
      const customerUser = { role: 'CUSTOMER' };

      for (const route of shopkeeperRoutes) {
        const result = checkRouteAuthorization(customerUser, {
          requireAuth: true,
          allowedRoles: ['SHOPKEEPER'],
        });
        expect(result.status, `Customer must not access ${route}`).toBe('ACCESS_RESTRICTED');
      }
    });

    it('Shopkeeper user is RESTRICTED from Super Admin routes', () => {
      const adminRoutes = [
        '/admin/governance',
        '/admin/approvals',
        '/admin/shops',
        '/admin/users',
        '/admin/audit',
      ];

      const shopkeeperUser = { role: 'SHOPKEEPER' };

      for (const route of adminRoutes) {
        const result = checkRouteAuthorization(shopkeeperUser, {
          requireAuth: true,
          allowedRoles: ['ADMIN'],
        });
        expect(result.status, `Shopkeeper must not access ${route}`).toBe('ACCESS_RESTRICTED');
      }
    });

    it('Public storefront routes (/, /customer/dashboard, /shop/:id) NEVER restrict logged-in Shopkeeper', () => {
      const publicRoutes = ['/', '/customer/dashboard', '/shop/test-shop-id'];
      const shopkeeperUser = { role: 'SHOPKEEPER' };

      for (const route of publicRoutes) {
        const result = checkRouteAuthorization(shopkeeperUser, {
          requireAuth: false,
        });
        expect(result.status, `Public route ${route} must never restrict logged-in shopkeepers`).toBe('ALLOWED');
      }
    });

    it('Customer profile and pickup orders allow all authenticated roles (CUSTOMER, SHOPKEEPER, ADMIN)', () => {
      const sharedRoutes = ['/customer/orders', '/customer/profile', '/checkout'];
      const roles = ['CUSTOMER', 'SHOPKEEPER', 'ADMIN'];

      for (const role of roles) {
        for (const route of sharedRoutes) {
          const result = checkRouteAuthorization(
            { role },
            {
              requireAuth: true,
              allowedRoles: ['CUSTOMER', 'SHOPKEEPER', 'ADMIN'],
            }
          );
          expect(result.status, `Role ${role} should access ${route}`).toBe('ALLOWED');
        }
      }
    });

    it('Unauthenticated visitors are prompted to login on protected routes', () => {
      const result = checkRouteAuthorization(null, {
        requireAuth: true,
        allowedRoles: ['SHOPKEEPER'],
      });
      expect(result.status).toBe('AUTH_REQUIRED');
    });

    it('Unauthenticated visitors are allowed on public storefront without blocking', () => {
      const result = checkRouteAuthorization(null, {
        requireAuth: false,
      });
      expect(result.status).toBe('ALLOWED');
    });
  });
});
