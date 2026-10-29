// Vitest globals enabled in vitest.config.ts
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/prisma.js';

describe('Village1 Phase 3 & 4: Products, Cart, Orders & Pickup Verification Tests', () => {
  let customerToken: string;
  let customerId: string;
  let shopkeeperToken: string;
  let shopkeeperId: string;
  let adminToken: string;
  let testShopId: string;
  let validProductId: string;
  let validProductPrice: number;
  let foreignShopId: string;
  let foreignProductId: string;
  let testOrderId: string;
  let testPickupCode: string;

  beforeAll(async () => {
    // 1. Authenticate Customer
    const custRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer@village1.in',
      password: 'Customer@123',
    });
    customerToken = custRes.body.data.tokens.accessToken;
    customerId = custRes.body.data.user.id;

    // 2. Authenticate Shopkeeper
    const shopRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'shopkeeper@village1.in',
      password: 'Shopkeeper@123',
    });
    shopkeeperToken = shopRes.body.data.tokens.accessToken;
    shopkeeperId = shopRes.body.data.user.id;

    // 3. Authenticate Admin
    const adminRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin@village1.in',
      password: 'AdminSecure@123',
    });
    adminToken = adminRes.body.data.tokens.accessToken;

    // 4. Find approved Murugan Maligai Store & an in-stock product
    const shop = await prisma.shop.findFirst({
      where: { slug: 'murugan-maligai-alanganallur' },
      include: {
        products: {
          where: { isAvailable: true, isArchived: false, stock: { gte: 10 } },
        },
      },
    });

    if (!shop || !shop.products.length) {
      throw new Error('Seed data missing approved grocery shop or in-stock products');
    }

    testShopId = shop.id;
    validProductId = shop.products[0].id;
    validProductPrice = shop.products[0].price;

    // 5. Create a separate foreign shop & product to test cross-shop cart prevention
    const category = await prisma.shopCategory.findFirst();
    const foreignShop = await prisma.shop.create({
      data: {
        name: 'Secondary Test Shop',
        slug: `secondary-test-${Date.now()}`,
        categoryId: category!.id,
        address: '55 East St',
        village: 'Alanganallur',
        district: 'Madurai',
        pinCode: '625501',
        phone: '9812345678',
        verificationStatus: 'APPROVED',
        isActive: true,
        products: {
          create: {
            name: 'Foreign Biscuit',
            price: 50,
            stock: 10,
            unit: 'packet',
            isAvailable: true,
          },
        },
      },
      include: { products: true },
    });
    foreignShopId = foreignShop.id;
    foreignProductId = foreignShop.products[0].id;
  });

  afterAll(async () => {
    // Cleanup foreign shop
    if (foreignShopId) {
      await prisma.order.deleteMany({ where: { shopId: foreignShopId } });
      await prisma.product.deleteMany({ where: { shopId: foreignShopId } });
      await prisma.shop.deleteMany({ where: { id: foreignShopId } });
    }
    // Cleanup test order
    if (testOrderId) {
      await prisma.order.deleteMany({ where: { id: testOrderId } });
    }
  });

  describe('1. Product Listing & Search API', () => {
    it('GET /api/v1/shops/:shopId/products should list all active products for the shop', async () => {
      const res = await request(app).get(`/api/v1/shops/${testShopId}/products`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.products.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/shops/:shopId/products?search=Rice should return matching products', async () => {
      const res = await request(app).get(`/api/v1/shops/${testShopId}/products?search=Rice`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const matches = res.body.data.products;
      expect(matches.length).toBeGreaterThanOrEqual(1);
      expect(matches[0].name.toLowerCase()).toContain('rice');
    });

    it('GET /api/v1/shops/:shopId/products?search=NonExistentGizmo123 should return empty array', async () => {
      const res = await request(app).get(`/api/v1/shops/${testShopId}/products?search=NonExistentGizmo123`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products.length).toBe(0);
    });

    it('should strictly isolate products between shops: foreign products must NEVER appear under test shop', async () => {
      // 1. Fetch testShopId products
      const testRes = await request(app).get(`/api/v1/shops/${testShopId}/products`);
      expect(testRes.status).toBe(200);
      const testProducts = testRes.body.data.products;
      // Ensure all returned products strictly belong to testShopId
      testProducts.forEach((p: any) => {
        expect(p.shopId).toBe(testShopId);
        expect(p.id).not.toBe(foreignProductId);
      });

      // 2. Fetch foreignShopId products
      const foreignRes = await request(app).get(`/api/v1/shops/${foreignShopId}/products`);
      expect(foreignRes.status).toBe(200);
      const foreignProducts = foreignRes.body.data.products;
      expect(foreignProducts.length).toBe(1);
      expect(foreignProducts[0].id).toBe(foreignProductId);
      expect(foreignProducts[0].name).toBe('Foreign Biscuit');

      // None of testShop products should be in foreignShop
      foreignProducts.forEach((p: any) => {
        expect(p.shopId).toBe(foreignShopId);
        expect(p.id).not.toBe(validProductId);
      });
    });

    it('should exclude archived/unavailable products from Karthik Hair Studio customer listing while preserving Murugan Maligai Store rice', async () => {
      const karthikShop = await prisma.shop.findFirst({
        where: { name: { contains: "Karthik Men's Hair Studio" } },
        include: { products: true },
      });

      if (karthikShop) {
        const res = await request(app).get(`/api/v1/shops/${karthikShop.id}/products`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const prods = res.body.data.products;
        // Verify every product returned matches karthikShop.id
        prods.forEach((p: any) => {
          expect(p.shopId).toBe(karthikShop.id);
        });

        // The erroneously created rice product is archived and must NOT appear in public catalog
        const salonRice = prods.find((p: any) => p.sku === '123' || p.name.toLowerCase() === 'rice');
        expect(salonRice).toBeUndefined();
      }

      // Verify Murugan Maligai Store's genuine rice product remains available
      const muruganShop = await prisma.shop.findFirst({
        where: { slug: 'murugan-maligai-alanganallur' },
      });
      const muruganRes = await request(app).get(`/api/v1/shops/${muruganShop!.id}/products?search=rice`);
      expect(muruganRes.status).toBe(200);
      expect(muruganRes.body.data.products.length).toBeGreaterThanOrEqual(1);
      const muruganRice = muruganRes.body.data.products.find((p: any) => p.sku === '123');
      expect(muruganRice).toBeDefined();
      expect(muruganRice!.isAvailable).toBe(true);
      expect(muruganRice!.shopId).toBe(muruganShop!.id);
    });
  });

  describe('2. Order Placement & Server-Calculated Pricing', () => {
    it('should reject order placement without authentication with 401', async () => {
      const res = await request(app).post('/api/v1/orders').send({
        shopId: testShopId,
        paymentMethod: 'CASH_ON_PICKUP',
        items: [{ productId: validProductId, quantity: 1 }],
      });
      expect(res.status).toBe(401);
    });

    it('should reject order with cross-shop products', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shopId: testShopId,
          paymentMethod: 'CASH_ON_PICKUP',
          items: [{ productId: foreignProductId, quantity: 1 }], // Belongs to foreignShopId
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CROSS_SHOP_PRODUCT');
    });

    it('should reject order with excessive quantity beyond stock', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shopId: testShopId,
          paymentMethod: 'CASH_ON_PICKUP',
          items: [{ productId: validProductId, quantity: 999999 }], // Exceeds schema / stock
        });
      expect(res.status).toBe(422); // Zod max 100
    });

    it('should calculate total on the server regardless of client input and create PENDING order', async () => {
      const quantity = 2;
      const expectedTotal = validProductPrice * quantity;

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shopId: testShopId,
          paymentMethod: 'CASH_ON_PICKUP',
          notes: 'Please pack in eco-friendly paper bag',
          items: [{ productId: validProductId, quantity }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const order = res.body.data.order;
      expect(order.status).toBe('PENDING');
      expect(order.paymentStatus).toBe('PENDING'); // Never falsely marked PAID
      expect(order.totalAmount).toBe(expectedTotal);
      expect(order.pickupCode).toBeDefined();
      expect(order.orderNumber).toMatch(/^ORD-/);

      testOrderId = order.id;
      testPickupCode = order.pickupCode;
    });
  });

  describe('3. Order Tracking & Customer Access Control', () => {
    it('customer can view their order history', async () => {
      const res = await request(app)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const orders = res.body.data.orders;
      expect(orders.some((o: any) => o.id === testOrderId)).toBe(true);
    });

    it('customer can inspect their single order details', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.order.id).toBe(testOrderId);
      expect(res.body.data.order.items.length).toBe(1);
    });

    it('other customers cannot view orders they do not own', async () => {
      // Register a second customer
      const rand = Math.floor(10000000 + Math.random() * 90000000);
      const reg = await request(app).post('/api/v1/auth/register').send({
        role: 'CUSTOMER',
        fullName: 'Sneha Test',
        phone: `92${rand}`,
        password: 'Password@123',
        village: 'Alanganallur',
        district: 'Madurai',
        pinCode: '625501',
      });
      expect(reg.status).toBe(201);
      const otherCustToken = reg.body.data.tokens.accessToken;

      const res = await request(app)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${otherCustToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('4. Shopkeeper Order Workflow & Status Transitions', () => {
    it('shopkeeper can view incoming shop orders', async () => {
      const res = await request(app)
        .get('/api/v1/orders/shop-orders')
        .set('Authorization', `Bearer ${shopkeeperToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders.some((o: any) => o.id === testOrderId)).toBe(true);
    });

    it('customer cannot change order status', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'ACCEPTED' });
      expect(res.status).toBe(403);
    });

    it('rejection requires a clear rejection reason', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({ status: 'REJECTED', rejectionReason: '' });
      expect(res.status).toBe(422); // Zod min 3 chars
    });

    it('invalid status transition (PENDING -> READY_FOR_PICKUP) should be rejected', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({ status: 'READY_FOR_PICKUP' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('shopkeeper moves order: PENDING -> ACCEPTED', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({ status: 'ACCEPTED' });
      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe('ACCEPTED');
    });

    it('rejects READY_FOR_PICKUP if items are not packed yet', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({ status: 'READY_FOR_PICKUP' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION'); // ACCEPTED cannot go directly to READY_FOR_PICKUP
    });

    it('unauthorized shopkeeper belonging to another shop cannot pack order items', async () => {
      // Create another shopkeeper user
      const rand = Math.floor(10000000 + Math.random() * 90000000);
      const reg = await request(app).post('/api/v1/auth/register').send({
        role: 'SHOPKEEPER',
        fullName: 'Foreign Shopkeeper',
        phone: `93${rand}`,
        password: 'Password@123',
        village: 'Alanganallur',
        district: 'Madurai',
        pinCode: '625501',
      });
      const foreignShopkeeperToken = reg.body.data.tokens.accessToken;

      // Get order item ID
      const orderRes = await request(app)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${shopkeeperToken}`);
      const itemId = orderRes.body.data.order.items[0].id;

      const packRes = await request(app)
        .put(`/api/v1/orders/${testOrderId}/items/${itemId}/pack`)
        .set('Authorization', `Bearer ${foreignShopkeeperToken}`)
        .send({ isPacked: true });
      expect(packRes.status).toBe(403);
      expect(packRes.body.error.code).toBe('FORBIDDEN');
    });

    it('shopkeeper marks order item as packed individually and status auto-transitions to PREPARING', async () => {
      // Fetch order item
      const orderRes = await request(app)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${shopkeeperToken}`);
      const itemId = orderRes.body.data.order.items[0].id;

      // Mark packed
      const packRes = await request(app)
        .put(`/api/v1/orders/${testOrderId}/items/${itemId}/pack`)
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({ isPacked: true });

      expect(packRes.status).toBe(200);
      expect(packRes.body.success).toBe(true);
      expect(packRes.body.data.item.isPacked).toBe(true);
      expect(packRes.body.data.item.packedAt).toBeDefined();
      expect(packRes.body.data.orderStatus).toBe('PREPARING');
      expect(packRes.body.data.packingProgress.allPacked).toBe(true);
      expect(packRes.body.data.packingProgress.packedCount).toBe(1);
    });

    it('persists item packing state in database across re-fetches', async () => {
      const orderRes = await request(app)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${shopkeeperToken}`);
      expect(orderRes.status).toBe(200);
      expect(orderRes.body.data.order.status).toBe('PREPARING');
      expect(orderRes.body.data.order.items[0].isPacked).toBe(true);
    });

    it('rejects READY_FOR_PICKUP if an item is unpacked again', async () => {
      const orderRes = await request(app)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${shopkeeperToken}`);
      const itemId = orderRes.body.data.order.items[0].id;

      // Unpack item
      await request(app)
        .put(`/api/v1/orders/${testOrderId}/items/${itemId}/pack`)
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({ isPacked: false });

      // Try marking ready
      const readyRes = await request(app)
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({ status: 'READY_FOR_PICKUP' });
      expect(readyRes.status).toBe(400);
      expect(readyRes.body.error.code).toBe('ALL_ITEMS_MUST_BE_PACKED');

      // Re-pack item
      await request(app)
        .put(`/api/v1/orders/${testOrderId}/items/${itemId}/pack`)
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({ isPacked: true });
    });

    it('shopkeeper moves order: PREPARING -> READY_FOR_PICKUP when all items are packed', async () => {
      const res = await request(app)
        .put(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({ status: 'READY_FOR_PICKUP' });
      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe('READY_FOR_PICKUP');
    });
  });

  describe('5. Secure Pickup Verification & Idempotent Collection', () => {
    it('collection with wrong pickup code should be rejected with 400', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${testOrderId}/verify-pickup`)
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({ pickupCode: '000000' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_PICKUP_CODE');
    });

    it('collection with valid 6-digit pickup code should transition to COLLECTED and mark payment PAID', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${testOrderId}/verify-pickup`)
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({ pickupCode: testPickupCode });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.status).toBe('COLLECTED');
      expect(res.body.data.order.paymentStatus).toBe('PAID');
    });

    it('subsequent collection verification is idempotent', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${testOrderId}/verify-pickup`)
        .set('Authorization', `Bearer ${shopkeeperToken}`)
        .send({ pickupCode: testPickupCode });
      expect(res.status).toBe(200);
      expect(res.body.data.alreadyCollected).toBe(true);
    });
  });
});
