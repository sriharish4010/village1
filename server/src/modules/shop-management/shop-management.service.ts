import { prisma } from '../../config/prisma.js';

export class ShopManagementService {
  /**
   * Helper to verify shop exists and is approved
   */
  static async verifyApprovedShop(shopId: string) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { category: true },
    });
    if (!shop) {
      throw { statusCode: 404, code: 'SHOP_NOT_FOUND', message: 'Shop not found' };
    }
    if (shop.verificationStatus !== 'APPROVED') {
      throw {
        statusCode: 403,
        code: 'SHOP_NOT_APPROVED',
        message: 'This shop is not yet approved by the administrator. Operations are restricted until approval.',
      };
    }
    return shop;
  }

  /**
   * Generate SKU if not provided
   */
  private static generateSku(shopId: string, name: string): string {
    const prefix = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'ITM';
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${random}`;
  }

  /**
   * Generate Unique Invoice Number for POS Bill
   */
  private static generateInvoiceNumber(shopSlug: string): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const cleanSlug = shopSlug.slice(0, 4).toUpperCase();
    return `INV-${cleanSlug}-${dateStr}-${rand}`;
  }

  /**
   * 1. Get products for shopkeeper with filtering and pagination
   */
  static async getShopItems(
    shopId: string,
    query: {
      search?: string;
      category?: string;
      availability?: string;
      lowStockOnly?: string;
      includeArchived?: string;
      page?: string;
      limit?: string;
    }
  ) {
    await this.verifyApprovedShop(shopId);

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50', 10)));
    const skip = (page - 1) * limit;

    const where: any = { shopId };

    if (query.includeArchived !== 'true') {
      where.isArchived = false;
    }

    if (query.availability === 'AVAILABLE') {
      where.isAvailable = true;
    } else if (query.availability === 'UNAVAILABLE') {
      where.isAvailable = false;
    }

    if (query.category && query.category.trim()) {
      where.category = { contains: query.category.trim() };
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { sku: { contains: q } },
        { category: { contains: q } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isAvailable: 'desc' }, { name: 'asc' }],
      }),
    ]);

    // Enhance items with stock value and low stock status
    const itemsWithMetrics = items.map((item) => ({
      ...item,
      stockValue: Math.round(item.stock * item.price * 100) / 100,
      isLowStock: item.stock <= (item.lowStockThreshold ?? 5),
    }));

    return {
      items: itemsWithMetrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 2. Create product
   */
  static async createItem(
    shopId: string,
    userId: string,
    data: {
      name: string;
      category?: string;
      description?: string;
      sku?: string;
      price: number;
      mrp?: number | null;
      stock?: number;
      unit?: string;
      imageUrl?: string | null;
      isAvailable?: boolean;
      lowStockThreshold?: number;
    }
  ) {
    await this.verifyApprovedShop(shopId);

    const sku = data.sku?.trim() || this.generateSku(shopId, data.name);
    const initialStock = data.stock ?? 0;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          shopId,
          name: data.name.trim(),
          category: data.category?.trim() || null,
          description: data.description?.trim() || null,
          sku,
          price: data.price,
          mrp: data.mrp || null,
          stock: initialStock,
          unit: data.unit?.trim() || 'piece',
          imageUrl: data.imageUrl || null,
          isAvailable: data.isAvailable ?? true,
          lowStockThreshold: data.lowStockThreshold ?? 5,
        },
      });

      if (initialStock > 0) {
        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            shopId,
            type: 'RESTOCK',
            quantityDelta: initialStock,
            previousStock: 0,
            newStock: initialStock,
            reason: 'Initial stock on item creation',
            actorId: userId,
          },
        });
      }

      return product;
    });

    return result;
  }

  /**
   * 3. Update product details
   */
  static async updateItem(
    shopId: string,
    productId: string,
    userId: string,
    data: {
      name?: string;
      category?: string | null;
      description?: string | null;
      sku?: string | null;
      price?: number;
      mrp?: number | null;
      stock?: number;
      unit?: string;
      imageUrl?: string | null;
      isAvailable?: boolean;
      isArchived?: boolean;
      lowStockThreshold?: number;
    }
  ) {
    await this.verifyApprovedShop(shopId);

    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing || existing.shopId !== shopId) {
      throw { statusCode: 404, code: 'ITEM_NOT_FOUND', message: 'Item not found in this shop' };
    }

    // If stock is directly modified here, log movement
    const stockChanged = data.stock !== undefined && data.stock !== existing.stock;
    const delta = stockChanged ? data.stock! - existing.stock : 0;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name !== undefined ? data.name.trim() : undefined,
          category: data.category !== undefined ? data.category?.trim() || null : undefined,
          description: data.description !== undefined ? data.description?.trim() || null : undefined,
          sku: data.sku !== undefined ? data.sku?.trim() || null : undefined,
          price: data.price !== undefined ? data.price : undefined,
          mrp: data.mrp !== undefined ? data.mrp : undefined,
          stock: data.stock !== undefined ? data.stock : undefined,
          unit: data.unit !== undefined ? data.unit.trim() : undefined,
          imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
          isAvailable: data.isAvailable !== undefined ? data.isAvailable : undefined,
          isArchived: data.isArchived !== undefined ? data.isArchived : undefined,
          lowStockThreshold: data.lowStockThreshold !== undefined ? data.lowStockThreshold : undefined,
        },
      });

      if (stockChanged) {
        await tx.inventoryLog.create({
          data: {
            productId,
            shopId,
            type: delta > 0 ? 'RESTOCK' : 'ADJUSTMENT',
            quantityDelta: delta,
            previousStock: existing.stock,
            newStock: data.stock!,
            reason: 'Direct item edit stock update',
            actorId: userId,
          },
        });
      }

      return updated;
    });

    return result;
  }

  /**
   * 4. Stock adjustment with mandatory reason
   */
  static async adjustStock(
    shopId: string,
    productId: string,
    userId: string,
    delta: number,
    reason: string
  ) {
    await this.verifyApprovedShop(shopId);

    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing || existing.shopId !== shopId) {
      throw { statusCode: 404, code: 'ITEM_NOT_FOUND', message: 'Item not found in this shop' };
    }

    const newStock = existing.stock + delta;
    if (newStock < 0) {
      throw {
        statusCode: 400,
        code: 'INSUFFICIENT_STOCK',
        message: `Cannot decrease stock below zero. Current stock: ${existing.stock}, requested delta: ${delta}`,
      };
    }

    const type = delta > 0 ? (reason.toLowerCase().includes('return') ? 'RETURN' : 'RESTOCK') : 'ADJUSTMENT';

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      const log = await tx.inventoryLog.create({
        data: {
          productId,
          shopId,
          type,
          quantityDelta: delta,
          previousStock: existing.stock,
          newStock,
          reason: reason.trim(),
          actorId: userId,
        },
      });

      return { product: updatedProduct, log };
    });

    return result;
  }

  /**
   * 5. Inventory list with valuation, thresholds, and low-stock indicators
   */
  static async getInventoryOverview(shopId: string) {
    const shop = await this.verifyApprovedShop(shopId);

    const products = await prisma.product.findMany({
      where: { shopId, isArchived: false },
      orderBy: { stock: 'asc' },
    });

    let totalStockItems = 0;
    let totalStockValue = 0;
    let lowStockCount = 0;

    const inventoryList = products.map((p) => {
      const value = Math.round(p.stock * p.price * 100) / 100;
      const isLow = p.stock <= (p.lowStockThreshold ?? 5);

      totalStockItems += p.stock;
      totalStockValue += value;
      if (isLow) lowStockCount++;

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        sku: p.sku || 'N/A',
        stock: p.stock,
        unit: p.unit,
        price: p.price,
        mrp: p.mrp,
        stockValue: value,
        lowStockThreshold: p.lowStockThreshold ?? 5,
        isLowStock: isLow,
        isAvailable: p.isAvailable,
        updatedAt: p.updatedAt,
      };
    });

    return {
      shopName: shop.name,
      metrics: {
        totalProducts: products.length,
        totalStockUnits: totalStockItems,
        totalInventoryValue: Math.round(totalStockValue * 100) / 100,
        lowStockItemsCount: lowStockCount,
      },
      items: inventoryList,
    };
  }

  /**
   * 6. Inventory Movement History Log
   */
  static async getInventoryHistory(
    shopId: string,
    query: { productId?: string; page?: string; limit?: string }
  ) {
    await this.verifyApprovedShop(shopId);

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50', 10)));
    const skip = (page - 1) * limit;

    const where: any = { shopId };
    if (query.productId) {
      where.productId = query.productId;
    }

    const [total, logs] = await Promise.all([
      prisma.inventoryLog.count({ where }),
      prisma.inventoryLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: {
            select: { id: true, name: true, sku: true, unit: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 7. Create POS Bill (Draft or Finalized Walk-in Sale)
   */
  static async createPosBill(
    shopId: string,
    operatorId: string,
    data: {
      customerName?: string | null;
      customerPhone?: string | null;
      customerAddress?: string | null;
      discount?: number;
      paymentMethod: 'CASH' | 'UPI';
      paymentReference?: string | null;
      cashReceived?: number | null;
      isDraft?: boolean;
      paymentConfirmed?: boolean;
      notes?: string | null;
      items: { productId: string; quantity: number }[];
    }
  ) {
    const shop = await this.verifyApprovedShop(shopId);

    if (!data.items || data.items.length === 0) {
      throw { statusCode: 400, code: 'EMPTY_BILL', message: 'Bill must contain at least one item' };
    }

    // 1. Fetch products and validate ownership & stock
    const productIds = data.items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (dbProducts.length !== productIds.length) {
      throw { statusCode: 404, code: 'ITEM_NOT_FOUND', message: 'One or more items in the bill do not exist' };
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let calculatedSubtotal = 0;
    const validatedBillItems: {
      productId: string;
      productName: string;
      sku: string | null;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
      currentStock: number;
    }[] = [];

    for (const item of data.items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        throw { statusCode: 404, code: 'ITEM_NOT_FOUND', message: `Product ${item.productId} not found` };
      }

      if (prod.shopId !== shopId) {
        throw {
          statusCode: 403,
          code: 'CROSS_SHOP_PRODUCT',
          message: `Product "${prod.name}" does not belong to this shop`,
        };
      }

      if (prod.isArchived) {
        throw {
          statusCode: 400,
          code: 'ITEM_ARCHIVED',
          message: `Item "${prod.name}" is archived and cannot be billed`,
        };
      }

      // If finalizing right now (not draft), stock must be available
      if (!data.isDraft && prod.stock < item.quantity) {
        throw {
          statusCode: 400,
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock for "${prod.name}". Available: ${prod.stock}, required for bill: ${item.quantity}`,
        };
      }

      const itemTotal = Math.round(prod.price * item.quantity * 100) / 100;
      calculatedSubtotal += itemTotal;

      validatedBillItems.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unitPrice: prod.price,
        quantity: item.quantity,
        totalPrice: itemTotal,
        currentStock: prod.stock,
      });
    }

    calculatedSubtotal = Math.round(calculatedSubtotal * 100) / 100;
    const discount = Math.min(calculatedSubtotal, Math.max(0, data.discount || 0));
    const totalAmount = Math.max(0, Math.round((calculatedSubtotal - discount) * 100) / 100);

    const isDraft = !!data.isDraft;
    const invoiceNumber = this.generateInvoiceNumber(shop.slug || 'SHOP');

    let paymentStatus = 'PENDING_VERIFICATION';
    if (!isDraft) {
      if (data.paymentMethod === 'CASH') {
        paymentStatus = 'PAID_CASH';
      } else if (data.paymentMethod === 'UPI') {
        paymentStatus = data.paymentConfirmed ? 'PAID_UPI' : 'PENDING_VERIFICATION';
      }
    }

    // Validate Cash Received if not draft and CASH payment
    if (!isDraft && data.paymentMethod === 'CASH' && data.cashReceived !== undefined && data.cashReceived !== null) {
      if (data.cashReceived < totalAmount) {
        throw {
          statusCode: 400,
          code: 'INSUFFICIENT_CASH',
          message: `Cash received (₹${data.cashReceived}) is less than total payable amount (₹${totalAmount})`,
        };
      }
    }

    // Atomic Transaction: Create Bill, BillItems, and if finalized, decrement stock & insert InventoryLogs
    const result = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.create({
        data: {
          invoiceNumber,
          shopId,
          operatorId,
          customerName: data.customerName?.trim() || null,
          customerPhone: data.customerPhone?.trim() || null,
          customerAddress: data.customerAddress?.trim() || null,
          status: isDraft ? 'DRAFT' : 'FINALIZED',
          subtotal: calculatedSubtotal,
          discount,
          totalAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus,
          paymentReference: data.paymentReference?.trim() || null,
          cashReceived: data.paymentMethod === 'CASH' && data.cashReceived !== undefined ? data.cashReceived : null,
          notes: data.notes?.trim() || null,
          items: {
            create: validatedBillItems.map((bi) => ({
              productId: bi.productId,
              productName: bi.productName,
              sku: bi.sku,
              unitPrice: bi.unitPrice,
              quantity: bi.quantity,
              totalPrice: bi.totalPrice,
            })),
          },
        },
        include: {
          items: true,
          shop: {
            select: {
              id: true,
              name: true,
              address: true,
              village: true,
              district: true,
              phone: true,
            },
          },
        },
      });

      // If finalized, decrement stock and log movement atomically
      if (!isDraft) {
        for (const bi of validatedBillItems) {
          const currentProd = await tx.product.findUnique({ where: { id: bi.productId } });
          if (!currentProd || currentProd.stock < bi.quantity) {
            throw {
              statusCode: 400,
              code: 'INSUFFICIENT_STOCK',
              message: `Insufficient stock for "${bi.productName}". Available: ${currentProd?.stock ?? 0}, required for bill: ${bi.quantity}`,
            };
          }

          const newStock = currentProd.stock - bi.quantity;
          await tx.product.update({
            where: { id: bi.productId },
            data: { stock: newStock },
          });

          await tx.inventoryLog.create({
            data: {
              productId: bi.productId,
              shopId,
              type: 'SALE_POS',
              quantityDelta: -bi.quantity,
              previousStock: currentProd.stock,
              newStock,
              reason: `Walk-in POS Sale: Invoice #${invoiceNumber}`,
              actorId: operatorId,
              referenceId: bill.id,
            },
          });
        }
      }

      return bill;
    });

    return result;
  }

  /**
   * 7b. Update Draft POS Bill
   */
  static async updatePosDraftBill(
    shopId: string,
    billId: string,
    operatorId: string,
    data: {
      customerName?: string | null;
      customerPhone?: string | null;
      customerAddress?: string | null;
      discount?: number;
      paymentMethod: 'CASH' | 'UPI';
      paymentReference?: string | null;
      cashReceived?: number | null;
      notes?: string | null;
      items: { productId: string; quantity: number }[];
    }
  ) {
    await this.verifyApprovedShop(shopId);

    const existingBill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { items: true },
    });

    if (!existingBill || existingBill.shopId !== shopId) {
      throw { statusCode: 404, code: 'BILL_NOT_FOUND', message: 'Bill not found' };
    }

    if (existingBill.status !== 'DRAFT') {
      throw {
        statusCode: 400,
        code: 'BILL_NOT_DRAFT',
        message: 'Finalized or voided bills cannot be edited directly. Use void/correction workflow.',
      };
    }

    if (!data.items || data.items.length === 0) {
      throw { statusCode: 400, code: 'EMPTY_BILL', message: 'Bill must contain at least one item' };
    }

    const productIds = data.items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (dbProducts.length !== productIds.length) {
      throw { statusCode: 404, code: 'ITEM_NOT_FOUND', message: 'One or more items in the bill do not exist' };
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    let calculatedSubtotal = 0;
    const validatedBillItems: {
      productId: string;
      productName: string;
      sku: string | null;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
    }[] = [];

    for (const item of data.items) {
      const prod = productMap.get(item.productId);
      if (!prod || prod.shopId !== shopId) {
        throw { statusCode: 403, code: 'CROSS_SHOP_PRODUCT', message: `Product does not belong to this shop` };
      }
      const itemTotal = Math.round(prod.price * item.quantity * 100) / 100;
      calculatedSubtotal += itemTotal;
      validatedBillItems.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unitPrice: prod.price,
        quantity: item.quantity,
        totalPrice: itemTotal,
      });
    }

    calculatedSubtotal = Math.round(calculatedSubtotal * 100) / 100;
    const discount = Math.min(calculatedSubtotal, Math.max(0, data.discount || 0));
    const totalAmount = Math.max(0, Math.round((calculatedSubtotal - discount) * 100) / 100);

    return prisma.$transaction(async (tx) => {
      await tx.billItem.deleteMany({ where: { billId } });

      const updated = await tx.bill.update({
        where: { id: billId },
        data: {
          customerName: data.customerName !== undefined ? (data.customerName?.trim() || null) : existingBill.customerName,
          customerPhone: data.customerPhone !== undefined ? (data.customerPhone?.trim() || null) : existingBill.customerPhone,
          customerAddress: data.customerAddress !== undefined ? (data.customerAddress?.trim() || null) : existingBill.customerAddress,
          subtotal: calculatedSubtotal,
          discount,
          totalAmount,
          paymentMethod: data.paymentMethod,
          paymentReference: data.paymentReference !== undefined ? (data.paymentReference?.trim() || null) : existingBill.paymentReference,
          cashReceived: data.paymentMethod === 'CASH' && data.cashReceived !== undefined ? data.cashReceived : existingBill.cashReceived,
          notes: data.notes !== undefined ? (data.notes?.trim() || null) : existingBill.notes,
          operatorId,
          items: {
            create: validatedBillItems,
          },
        },
        include: {
          items: true,
          shop: {
            select: { id: true, name: true, address: true, village: true, district: true, phone: true },
          },
        },
      });

      return updated;
    });
  }

  /**
   * 7c. Finalize Draft POS Bill (Atomically check stock, update bill, and decrement inventory)
   */
  static async finalizePosDraftBill(
    shopId: string,
    billId: string,
    operatorId: string,
    data: {
      customerName?: string | null;
      customerPhone?: string | null;
      customerAddress?: string | null;
      paymentMethod: 'CASH' | 'UPI';
      paymentReference?: string | null;
      paymentConfirmed?: boolean;
      cashReceived?: number | null;
    }
  ) {
    await this.verifyApprovedShop(shopId);

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { items: true, shop: true },
    });

    if (!bill || bill.shopId !== shopId) {
      throw { statusCode: 404, code: 'BILL_NOT_FOUND', message: 'Bill not found' };
    }

    if (bill.status !== 'DRAFT') {
      throw { statusCode: 400, code: 'BILL_ALREADY_FINALIZED', message: 'This bill is already finalized or voided' };
    }

    // Resolve final customer details (either passed in finalize payload or already stored on draft)
    const effectiveName = (data.customerName !== undefined ? data.customerName : bill.customerName)?.trim() || null;
    const effectivePhone = (data.customerPhone !== undefined ? data.customerPhone : bill.customerPhone)?.trim() || null;
    const effectiveAddress = (data.customerAddress !== undefined ? data.customerAddress : bill.customerAddress)?.trim() || null;

    if (!effectiveName || effectiveName.length < 2) {
      throw { statusCode: 400, code: 'INVALID_CUSTOMER_NAME', message: 'Customer name is required (minimum 2 characters)' };
    }
    if (!effectivePhone || !/^[6-9]\d{9}$/.test(effectivePhone)) {
      throw { statusCode: 400, code: 'INVALID_CUSTOMER_PHONE', message: 'A valid 10-digit Indian mobile number is required' };
    }
    if (!effectiveAddress || effectiveAddress.length < 2) {
      throw { statusCode: 400, code: 'INVALID_CUSTOMER_ADDRESS', message: 'Place / area is required (minimum 2 characters)' };
    }

    // Verify current stock for every item
    const productIds = bill.items.map((i) => i.productId).filter(Boolean) as string[];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    for (const bi of bill.items) {
      if (!bi.productId) continue;
      const prod = productMap.get(bi.productId);
      if (!prod) {
        throw { statusCode: 404, code: 'ITEM_NOT_FOUND', message: `Product ${bi.productName} no longer exists` };
      }
      if (prod.stock < bi.quantity) {
        throw {
          statusCode: 400,
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock for "${prod.name}". Available: ${prod.stock}, required: ${bi.quantity}`,
        };
      }
    }

    let paymentStatus = 'PENDING_VERIFICATION';
    if (data.paymentMethod === 'CASH') {
      paymentStatus = 'PAID_CASH';
    } else if (data.paymentMethod === 'UPI') {
      paymentStatus = data.paymentConfirmed ? 'PAID_UPI' : 'PENDING_VERIFICATION';
    }

    if (data.paymentMethod === 'CASH' && data.cashReceived !== undefined && data.cashReceived !== null) {
      if (data.cashReceived < bill.totalAmount) {
        throw {
          statusCode: 400,
          code: 'INSUFFICIENT_CASH',
          message: `Cash received (₹${data.cashReceived}) is less than total payable amount (₹${bill.totalAmount})`,
        };
      }
    }

    return prisma.$transaction(async (tx) => {
      // 1. Mark bill as FINALIZED
      const finalizedBill = await tx.bill.update({
        where: { id: billId },
        data: {
          customerName: effectiveName,
          customerPhone: effectivePhone,
          customerAddress: effectiveAddress,
          status: 'FINALIZED',
          paymentMethod: data.paymentMethod,
          paymentStatus,
          paymentReference: data.paymentReference?.trim() || null,
          cashReceived: data.paymentMethod === 'CASH' && data.cashReceived !== undefined ? data.cashReceived : null,
          operatorId,
        },
        include: {
          items: true,
          shop: {
            select: { id: true, name: true, address: true, village: true, district: true, phone: true },
          },
        },
      });

      // 2. Decrement stock atomically
      for (const bi of bill.items) {
        if (!bi.productId) continue;
        const currentProd = await tx.product.findUnique({ where: { id: bi.productId } });
        if (!currentProd || currentProd.stock < bi.quantity) {
          throw {
            statusCode: 400,
            code: 'INSUFFICIENT_STOCK',
            message: `Insufficient stock for "${bi.productName}". Available: ${currentProd?.stock ?? 0}, required: ${bi.quantity}`,
          };
        }
        const newStock = currentProd.stock - bi.quantity;

        await tx.product.update({
          where: { id: bi.productId },
          data: { stock: newStock },
        });

        await tx.inventoryLog.create({
          data: {
            productId: bi.productId,
            shopId,
            type: 'SALE_POS',
            quantityDelta: -bi.quantity,
            previousStock: currentProd.stock,
            newStock,
            reason: `Finalized Walk-in POS Sale: Invoice #${bill.invoiceNumber}`,
            actorId: operatorId,
            referenceId: bill.id,
          },
        });
      }

      return finalizedBill;
    });
  }

  /**
   * 7d. Void Finalized POS Bill (Restores inventory safely with an audit trail)
   */
  static async voidPosBill(
    shopId: string,
    billId: string,
    operatorId: string,
    reason: string
  ) {
    await this.verifyApprovedShop(shopId);

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { items: true },
    });

    if (!bill || bill.shopId !== shopId) {
      throw { statusCode: 404, code: 'BILL_NOT_FOUND', message: 'Bill not found' };
    }

    if (bill.status === 'VOIDED') {
      throw { statusCode: 400, code: 'BILL_ALREADY_VOIDED', message: 'Bill has already been voided' };
    }

    const wasFinalized = bill.status === 'FINALIZED';

    return prisma.$transaction(async (tx) => {
      const voidedBill = await tx.bill.update({
        where: { id: billId },
        data: {
          status: 'VOIDED',
          notes: bill.notes ? `${bill.notes} | Voided: ${reason}` : `Voided: ${reason}`,
        },
        include: {
          items: true,
          shop: {
            select: { id: true, name: true, address: true, village: true, district: true, phone: true },
          },
        },
      });

      // If it was finalized, restore stock for each item
      if (wasFinalized) {
        for (const bi of bill.items) {
          if (!bi.productId) continue;
          const prod = await tx.product.findUnique({ where: { id: bi.productId } });
          if (prod) {
            const newStock = prod.stock + bi.quantity;
            await tx.product.update({
              where: { id: bi.productId },
              data: { stock: { increment: bi.quantity } },
            });

            await tx.inventoryLog.create({
              data: {
                productId: bi.productId,
                shopId,
                type: 'REVERSAL',
                quantityDelta: bi.quantity,
                previousStock: prod.stock,
                newStock,
                reason: `Voided POS Bill #${bill.invoiceNumber}: ${reason}`,
                actorId: operatorId,
                referenceId: bill.id,
              },
            });
          }
        }
      }

      return voidedBill;
    });
  }

  /**
   * 8. Sales History (Both Walk-in POS Bills and Online Orders with Unified Filters)
   */
  static async getSalesHistory(
    shopId: string,
    query: {
      startDate?: string;
      endDate?: string;
      search?: string;
      source?: 'ALL' | 'POS_WALKIN' | 'ONLINE_ORDER';
      paymentMethod?: string;
      paymentStatus?: string;
      page?: string;
      limit?: string;
    }
  ) {
    await this.verifyApprovedShop(shopId);

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50', 10)));
    const skip = (page - 1) * limit;

    const source = query.source || 'ALL';

    // Build Bill (POS) where condition
    const billWhere: any = { shopId };
    if (query.startDate || query.endDate) {
      billWhere.createdAt = {};
      if (query.startDate) billWhere.createdAt.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        billWhere.createdAt.lte = end;
      }
    }
    if (query.paymentMethod && query.paymentMethod !== 'ALL') {
      billWhere.paymentMethod = query.paymentMethod;
    }
    if (query.paymentStatus && query.paymentStatus !== 'ALL') {
      billWhere.paymentStatus = query.paymentStatus;
    }
    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      billWhere.OR = [
        { invoiceNumber: { contains: q } },
        { customerName: { contains: q } },
        { customerPhone: { contains: q } },
        { customerAddress: { contains: q } },
      ];
    }

    // Build Order (Online) where condition - only sales orders (COLLECTED or PAID)
    const orderWhere: any = {
      shopId,
      status: { in: ['COLLECTED', 'COMPLETED', 'READY_FOR_PICKUP'] },
    };
    if (query.startDate || query.endDate) {
      orderWhere.createdAt = {};
      if (query.startDate) orderWhere.createdAt.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        orderWhere.createdAt.lte = end;
      }
    }
    if (query.paymentMethod && query.paymentMethod !== 'ALL') {
      orderWhere.paymentMethod = query.paymentMethod;
    }
    if (query.paymentStatus && query.paymentStatus !== 'ALL') {
      orderWhere.paymentStatus = query.paymentStatus;
    }
    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      orderWhere.OR = [
        { orderNumber: { contains: q } },
        { customer: { phone: { contains: q } } },
        { customer: { customerProfile: { fullName: { contains: q } } } },
      ];
    }

    let posBills: any[] = [];
    let onlineOrders: any[] = [];

    if (source === 'ALL' || source === 'POS_WALKIN') {
      posBills = await prisma.bill.findMany({
        where: billWhere,
        include: {
          items: true,
          shop: { select: { id: true, name: true, phone: true, address: true, village: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (source === 'ALL' || source === 'ONLINE_ORDER') {
      onlineOrders = await prisma.order.findMany({
        where: orderWhere,
        include: {
          items: {
            include: { product: { select: { unit: true } } },
          },
          customer: {
            select: {
              phone: true,
              customerProfile: { select: { fullName: true, village: true, district: true } },
            },
          },
          shop: { select: { id: true, name: true, phone: true, address: true, village: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Unify records
    const unifiedSales: any[] = [];

    for (const b of posBills) {
      unifiedSales.push({
        id: b.id,
        source: 'POS_WALKIN',
        invoiceNumber: b.invoiceNumber,
        referenceId: b.id,
        createdAt: b.createdAt,
        customerName: b.customerName || 'Walk-in Customer',
        customerPhone: b.customerPhone || null,
        customerAddress: b.customerAddress || null,
        subtotal: b.subtotal,
        discount: b.discount,
        totalAmount: b.totalAmount,
        paymentMethod: b.paymentMethod,
        paymentStatus: b.paymentStatus,
        paymentReference: b.paymentReference || null,
        cashReceived: b.cashReceived || null,
        status: b.status,
        notes: b.notes,
        itemsCount: b.items.length,
        items: b.items,
        shop: b.shop,
      });
    }

    for (const o of onlineOrders) {
      unifiedSales.push({
        id: o.id,
        source: 'ONLINE_ORDER',
        invoiceNumber: o.orderNumber,
        referenceId: o.id,
        createdAt: o.createdAt,
        customerName: o.customer?.customerProfile?.fullName || 'Online Customer',
        customerPhone: o.customer?.phone || null,
        customerAddress: o.customer?.customerProfile
          ? `${o.customer.customerProfile.village}, ${o.customer.customerProfile.district}`
          : null,
        subtotal: o.subtotalAmount || o.totalAmount,
        discount: 0,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod === 'CASH_ON_PICKUP' ? 'CASH' : o.paymentMethod,
        paymentStatus: o.paymentStatus === 'PAID' ? 'PAID' : o.paymentStatus,
        paymentReference: null,
        cashReceived: null,
        status: o.status,
        notes: o.notes,
        itemsCount: o.items.length,
        items: o.items.map((i: any) => ({
          id: i.id,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          sku: null,
        })),
        shop: o.shop,
      });
    }

    // Sort descending by date
    unifiedSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = unifiedSales.length;
    const paginated = unifiedSales.slice(skip, skip + limit);

    return {
      bills: paginated,
      sales: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * 9. Sales Reports (Unifies walk-in finalized sales and collected online orders without double counting)
   */
  static async getSalesReport(
    shopId: string,
    query?: { startDate?: string; endDate?: string }
  ) {
    const shop = await this.verifyApprovedShop(shopId);

    // 1. Today's metrics (midnight to now)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayBills, todayOrders] = await Promise.all([
      prisma.bill.findMany({
        where: {
          shopId,
          status: 'FINALIZED',
          createdAt: { gte: todayStart },
        },
      }),
      prisma.order.findMany({
        where: {
          shopId,
          status: { in: ['COLLECTED', 'COMPLETED'] },
          createdAt: { gte: todayStart },
        },
      }),
    ]);

    const todayWalkinGross = todayBills.reduce((acc: number, b: any) => acc + b.subtotal, 0);
    const todayWalkinDiscounts = todayBills.reduce((acc: number, b: any) => acc + b.discount, 0);
    const todayWalkinNet = todayBills.reduce((acc: number, b: any) => acc + b.totalAmount, 0);

    const todayOnlineGross = todayOrders.reduce((acc: number, o: any) => acc + (o.subtotalAmount || o.totalAmount), 0);
    const todayOnlineNet = todayOrders.reduce((acc: number, o: any) => acc + o.totalAmount, 0);

    const todayGrossSales = todayWalkinGross + todayOnlineGross;
    const todayDiscounts = todayWalkinDiscounts;
    const todayNetSales = todayWalkinNet + todayOnlineNet;

    // 2. Filtered Range metrics (default last 30 days)
    const rangeStart = query?.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    rangeStart.setHours(0, 0, 0, 0);

    const rangeEnd = query?.endDate ? new Date(query.endDate) : new Date();
    rangeEnd.setHours(23, 59, 59, 999);

    const [rangeBills, rangeOrders] = await Promise.all([
      prisma.bill.findMany({
        where: {
          shopId,
          status: 'FINALIZED',
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
        include: { items: true },
      }),
      prisma.order.findMany({
        where: {
          shopId,
          status: { in: ['COLLECTED', 'COMPLETED'] },
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
        include: { items: true },
      }),
    ]);

    const rangeWalkinGross = rangeBills.reduce((acc: number, b: any) => acc + b.subtotal, 0);
    const rangeWalkinDiscounts = rangeBills.reduce((acc: number, b: any) => acc + b.discount, 0);
    const rangeWalkinNet = rangeBills.reduce((acc: number, b: any) => acc + b.totalAmount, 0);

    const rangeOnlineGross = rangeOrders.reduce((acc: number, o: any) => acc + (o.subtotalAmount || o.totalAmount), 0);
    const rangeOnlineNet = rangeOrders.reduce((acc: number, o: any) => acc + o.totalAmount, 0);

    const rangeGrossSales = rangeWalkinGross + rangeOnlineGross;
    const rangeDiscounts = rangeWalkinDiscounts;
    const rangeNetSales = rangeWalkinNet + rangeOnlineNet;

    // 3. Best-selling items calculation across the range (combining walk-in & online)
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const b of rangeBills) {
      for (const item of b.items) {
        const key = item.productName;
        const cur = itemMap.get(key) || { name: key, quantity: 0, revenue: 0 };
        cur.quantity += item.quantity;
        cur.revenue += item.totalPrice;
        itemMap.set(key, cur);
      }
    }

    for (const o of rangeOrders) {
      for (const item of o.items) {
        const key = item.productName;
        const cur = itemMap.get(key) || { name: key, quantity: 0, revenue: 0 };
        cur.quantity += item.quantity;
        cur.revenue += item.totalPrice;
        itemMap.set(key, cur);
      }
    }

    const bestSellers = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((i) => ({
        ...i,
        revenue: Math.round(i.revenue * 100) / 100,
      }));

    // 4. Low stock summary
    const allProducts = await prisma.product.findMany({
      where: { shopId, isArchived: false },
      select: {
        id: true,
        name: true,
        stock: true,
        unit: true,
        lowStockThreshold: true,
        price: true,
      },
    });

    const lowStockItems = allProducts.filter((p) => p.stock <= (p.lowStockThreshold ?? 5));

    return {
      shopName: shop.name,
      today: {
        billsCount: todayBills.length + todayOrders.length,
        walkinCount: todayBills.length,
        onlineCount: todayOrders.length,
        grossSales: Math.round(todayGrossSales * 100) / 100,
        totalDiscounts: Math.round(todayDiscounts * 100) / 100,
        netSales: Math.round(todayNetSales * 100) / 100,
      },
      selectedRange: {
        startDate: rangeStart.toISOString(),
        endDate: rangeEnd.toISOString(),
        billsCount: rangeBills.length + rangeOrders.length,
        walkinCount: rangeBills.length,
        onlineCount: rangeOrders.length,
        grossSales: Math.round(rangeGrossSales * 100) / 100,
        totalDiscounts: Math.round(rangeDiscounts * 100) / 100,
        netSales: Math.round(rangeNetSales * 100) / 100,
      },
      bestSellers,
      lowStock: {
        count: lowStockItems.length,
        items: lowStockItems,
      },
    };
  }
}
