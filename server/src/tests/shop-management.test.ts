// Vitest globals enabled in vitest.config.ts
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/prisma.js';

describe('Village1 Complete Shopkeeper Management & POS Billing System Tests', () => {
  let shopkeeperToken: string;
  let shopkeeperId: string;
  let customerToken: string;
  let testShopId: string;
  let createdProductId: string;

  beforeAll(async () => {
    // 1. Authenticate Shopkeeper
    const shopRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'shopkeeper@village1.in',
      password: 'Shopkeeper@123',
    });
    shopkeeperToken = shopRes.body.data.tokens.accessToken;
    shopkeeperId = shopRes.body.data.user.id;

    // 2. Authenticate Customer
    const custRes = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer@village1.in',
      password: 'Customer@123',
    });
    customerToken = custRes.body.data.tokens.accessToken;

    // 3. Find approved shop
    const shop = await prisma.shop.findFirst({
      where: {
        verificationStatus: 'APPROVED',
        members: { some: { userId: shopkeeperId } },
      },
    });

    if (!shop) {
      throw new Error('Seed data missing approved shop for shopkeeper@village1.in');
    }
    testShopId = shop.id;
  });

  // Test 1: Item Creation
  it('allows authorized shopkeeper to add a new item with valid data', async () => {
    const res = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/items`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        name: 'Organic Sesame Oil 1L',
        category: 'Oils & Ghee',
        sku: 'OIL-SES-01',
        price: 320,
        mrp: 350,
        stock: 25,
        unit: 'litre',
        lowStockThreshold: 5,
        isAvailable: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product).toBeDefined();
    expect(res.body.data.product.name).toBe('Organic Sesame Oil 1L');
    expect(res.body.data.product.stock).toBe(25);
    createdProductId = res.body.data.product.id;
  });

  // Test 2: Price Validation (Price must be > 0)
  it('rejects product creation when price is <= 0', async () => {
    const res = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/items`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        name: 'Invalid Price Item',
        price: 0,
        stock: 10,
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  // Test 3: Edit Item and Update Prices
  it('allows updating item details and prices', async () => {
    const res = await request(app)
      .put(`/api/v1/shop-management/${testShopId}/items/${createdProductId}`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        price: 310,
        description: 'Cold pressed wood churned pure oil',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product.price).toBe(310);
    expect(res.body.data.product.description).toContain('Cold pressed');
  });

  // Test 4: Stock Adjustment with Reason
  it('records stock adjustment with recorded reason in inventory movements', async () => {
    const res = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/items/${createdProductId}/adjust-stock`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        delta: 15,
        reason: 'New distributor stock shipment received',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product.stock).toBe(40); // 25 + 15
    expect(res.body.data.log).toBeDefined();
    expect(res.body.data.log.reason).toBe('New distributor stock shipment received');
  });

  // Test 5: Insufficient Stock Protection (Cannot drop below 0)
  it('rejects stock adjustments that would cause negative inventory', async () => {
    const res = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/items/${createdProductId}/adjust-stock`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        delta: -100,
        reason: 'Accidental reduction',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  // Test 6: Inventory Overview and Stock Valuation
  it('returns inventory list with correct stock valuation and threshold status', async () => {
    const res = await request(app)
      .get(`/api/v1/shop-management/${testShopId}/inventory`)
      .set('Authorization', `Bearer ${shopkeeperToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.metrics.totalInventoryValue).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  // Test 7: POS Billing with Atomic Inventory Reduction
  it('creates walk-in POS bill with cash, generating unique invoice and deducting stock atomically', async () => {
    const beforeProduct = await prisma.product.findUnique({ where: { id: createdProductId } });
    const stockBefore = beforeProduct!.stock;

    const res = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/pos/bills`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        customerName: 'Senthil Kumar',
        customerPhone: '9842100000',
        customerAddress: 'Bazaar Street, Village 1',
        discount: 10,
        paymentMethod: 'CASH',
        items: [{ productId: createdProductId, quantity: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bill.invoiceNumber).toMatch(/^INV-/);
    expect(res.body.data.bill.subtotal).toBe(620); // 310 * 2
    expect(res.body.data.bill.discount).toBe(10);
    expect(res.body.data.bill.totalAmount).toBe(610);
    expect(res.body.data.bill.customerAddress).toBe('Bazaar Street, Village 1');

    // Verify stock atomically reduced
    const afterProduct = await prisma.product.findUnique({ where: { id: createdProductId } });
    expect(afterProduct!.stock).toBe(stockBefore - 2);
  });

  // Test 8: POS Billing with UPI Truthful Verification Status & Confirmed UPI
  it('records UPI payments with appropriate verification-pending status, and supports confirmed UPI', async () => {
    const res = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/pos/bills`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        customerName: 'Kavitha Devi',
        customerPhone: '9842199999',
        customerAddress: 'East Main Street, Village 1',
        paymentReference: 'UPI-REF-998877',
        paymentConfirmed: false,
        discount: 0,
        paymentMethod: 'UPI',
        items: [{ productId: createdProductId, quantity: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bill.paymentMethod).toBe('UPI');
    expect(res.body.data.bill.paymentStatus).toBe('PENDING_VERIFICATION');
    expect(res.body.data.bill.paymentReference).toBe('UPI-REF-998877');
    expect(res.body.data.bill.customerAddress).toBe('East Main Street, Village 1');

    // Confirmed UPI test
    const confirmedRes = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/pos/bills`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        customerName: 'Kavitha Devi',
        customerPhone: '9842199999',
        customerAddress: 'East Main Street, Village 1',
        paymentReference: 'UPI-REF-998888',
        paymentConfirmed: true,
        discount: 0,
        paymentMethod: 'UPI',
        items: [{ productId: createdProductId, quantity: 1 }],
      });

    expect(confirmedRes.status).toBe(201);
    expect(confirmedRes.body.data.bill.paymentStatus).toBe('PAID_UPI');
  });

  // Test 9: POS Validation for Required Customer Fields & Insufficient Stock Protection
  it('rejects POS billing without customer details when finalized, and rejects if stock insufficient', async () => {
    // Missing customer fields when finalized
    const missingRes = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/pos/bills`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        discount: 0,
        paymentMethod: 'CASH',
        items: [{ productId: createdProductId, quantity: 1 }],
      });

    expect(missingRes.status).toBe(422);
    expect(missingRes.body.success).toBe(false);

    // Insufficient stock
    const res = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/pos/bills`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        customerName: 'Valid Customer',
        customerPhone: '9842100000',
        customerAddress: 'Village 1 Main',
        items: [{ productId: createdProductId, quantity: 9999 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  // Test 9b: Cash Received Validation for Walk-in POS
  it('validates cash received amount when paymentMethod is CASH', async () => {
    // Insufficient cash received (< totalAmount)
    const failRes = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/pos/bills`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        customerName: 'Cash Customer',
        customerPhone: '9842100000',
        customerAddress: 'Village 1 Main',
        paymentMethod: 'CASH',
        cashReceived: 50, // Product price is 310, total is 310 > 50
        items: [{ productId: createdProductId, quantity: 1 }],
      });

    expect(failRes.status).toBe(400);
    expect(failRes.body.success).toBe(false);
    expect(failRes.body.error.code).toBe('INSUFFICIENT_CASH');

    // Sufficient cash received (>= totalAmount)
    const passRes = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/pos/bills`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        customerName: 'Cash Customer',
        customerPhone: '9842100000',
        customerAddress: 'Village 1 Main',
        paymentMethod: 'CASH',
        cashReceived: 500,
        items: [{ productId: createdProductId, quantity: 1 }],
      });

    expect(passRes.status).toBe(201);
    expect(passRes.body.success).toBe(true);
    expect(passRes.body.data.bill.paymentStatus).toBe('PAID_CASH');
    expect(passRes.body.data.bill.cashReceived).toBe(500);
  });

  // Test 10: Walk-in POS Draft Save, Edit, and Finalize Flow
  it('supports creating a draft bill without reducing stock, editing it, and finalizing with stock reduction', async () => {
    const beforeProduct = await prisma.product.findUnique({ where: { id: createdProductId } });
    const initialStock = beforeProduct!.stock;

    // 1. Create Draft Bill
    const draftRes = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/pos/bills`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        customerName: 'Draft Customer Murugan',
        customerPhone: '9876543210',
        customerAddress: 'South Bazaar, Village 1',
        isDraft: true,
        discount: 5,
        paymentMethod: 'CASH',
        items: [{ productId: createdProductId, quantity: 2 }],
      });

    expect(draftRes.status).toBe(201);
    expect(draftRes.body.data.bill.status).toBe('DRAFT');
    const draftBillId = draftRes.body.data.bill.id;

    // Stock should NOT be reduced yet for draft
    const stockAfterDraft = await prisma.product.findUnique({ where: { id: createdProductId } });
    expect(stockAfterDraft!.stock).toBe(initialStock);

    // 2. Edit Draft Bill (Change quantity to 3)
    const updateRes = await request(app)
      .put(`/api/v1/shop-management/${testShopId}/pos/bills/${draftBillId}`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        customerName: 'Draft Customer Murugan Updated',
        discount: 10,
        items: [{ productId: createdProductId, quantity: 3 }],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.bill.customerName).toBe('Draft Customer Murugan Updated');
    expect(updateRes.body.data.bill.discount).toBe(10);
    expect(updateRes.body.data.bill.subtotal).toBe(930); // 310 * 3
    expect(updateRes.body.data.bill.totalAmount).toBe(920);

    // Stock still unchanged
    const stockAfterEdit = await prisma.product.findUnique({ where: { id: createdProductId } });
    expect(stockAfterEdit!.stock).toBe(initialStock);

    // 3. Finalize Bill (Reduces stock now)
    const finalizeRes = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/pos/bills/${draftBillId}/finalize`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        cashReceived: 1000,
      });

    expect(finalizeRes.status).toBe(200);
    expect(finalizeRes.body.data.bill.status).toBe('FINALIZED');
    expect(finalizeRes.body.data.bill.cashReceived).toBe(1000);

    // Stock must be reduced by 3 now
    const stockAfterFinalize = await prisma.product.findUnique({ where: { id: createdProductId } });
    expect(stockAfterFinalize!.stock).toBe(initialStock - 3);

    // 4. Void Bill and check stock restoration
    const voidRes = await request(app)
      .post(`/api/v1/shop-management/${testShopId}/pos/bills/${draftBillId}/void`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        reason: 'Customer cancelled transaction after billing',
      });

    expect(voidRes.status).toBe(200);
    expect(voidRes.body.data.bill.status).toBe('VOIDED');

    // Stock must be restored back
    const stockAfterVoid = await prisma.product.findUnique({ where: { id: createdProductId } });
    expect(stockAfterVoid!.stock).toBe(initialStock);
  });

  // Test 11: Sales History with Walk-in POS and Online Orders
  it('retrieves unified sales history with filtering by source', async () => {
    // Fetch all sales
    const allSalesRes = await request(app)
      .get(`/api/v1/shop-management/${testShopId}/sales?source=ALL`)
      .set('Authorization', `Bearer ${shopkeeperToken}`);

    expect(allSalesRes.status).toBe(200);
    expect(allSalesRes.body.success).toBe(true);
    expect(allSalesRes.body.data.sales).toBeDefined();

    // Fetch only walk-in POS bills
    const posSalesRes = await request(app)
      .get(`/api/v1/shop-management/${testShopId}/sales?source=POS_WALKIN`)
      .set('Authorization', `Bearer ${shopkeeperToken}`);

    expect(posSalesRes.status).toBe(200);
    expect(posSalesRes.body.data.sales.every((s: any) => s.source === 'POS_WALKIN')).toBe(true);
  });

  // Test 12: Cross-Shop Isolation (Cannot bill against another shop)
  it('prevents shopkeeper from billing against a shop they do not own', async () => {
    const res = await request(app)
      .post(`/api/v1/shop-management/00000000-0000-0000-0000-000000000000/pos/bills`)
      .set('Authorization', `Bearer ${shopkeeperToken}`)
      .send({
        customerName: 'Intruder Test',
        items: [{ productId: createdProductId, quantity: 1 }],
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Test 13: Access Control Isolation (Customer cannot access shop management)
  it('blocks non-shopkeeper customer from accessing shop management endpoints', async () => {
    const res = await request(app)
      .get(`/api/v1/shop-management/${testShopId}/inventory`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Test 14: Sales Reports & Best Sellers
  it('returns truthful gross sales, discounts, net sales, and best sellers', async () => {
    const res = await request(app)
      .get(`/api/v1/shop-management/${testShopId}/reports`)
      .set('Authorization', `Bearer ${shopkeeperToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.today.billsCount).toBeGreaterThanOrEqual(2);
    expect(res.body.data.today.netSales).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.bestSellers)).toBe(true);
    expect(res.body.data.lowStock).toBeDefined();
  });
});
