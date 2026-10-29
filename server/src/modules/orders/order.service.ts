import { prisma } from '../../config/prisma.js';
import { CreateOrderInput, UpdateOrderStatusInput, VerifyPickupInput } from './order.validator.js';

export class OrderService {
  /**
   * Helper to generate human-readable unique order numbers
   * Format: ORD-YYYYMMDD-XXXXX
   */
  private static generateOrderNumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${dateStr}-${rand}`;
  }

  /**
   * Helper to generate a secure 6-digit pickup verification code
   */
  private static generatePickupCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Customer places a pickup order
   * - Scoped to one shop
   * - Server validates product availability, belonging to shop, and stock
   * - Server computes all subtotal, line items, and totals
   * - Reserves/decrements inventory in a transaction
   * - Creates OrderEvent and audit record
   */
  static async createOrder(customerId: string, input: CreateOrderInput) {
    // 1. Verify shop exists, is approved, and active
    const shop = await prisma.shop.findUnique({
      where: { id: input.shopId },
      select: {
        id: true,
        name: true,
        village: true,
        district: true,
        address: true,
        phone: true,
        verificationStatus: true,
        isActive: true,
      },
    });

    if (!shop) {
      throw { statusCode: 404, code: 'SHOP_NOT_FOUND', message: 'Shop not found' };
    }

    if (shop.verificationStatus !== 'APPROVED' || !shop.isActive) {
      throw { statusCode: 403, code: 'SHOP_NOT_ACTIVE', message: 'This shop is not accepting orders at this time' };
    }

    // 2. Fetch all requested products and validate they belong to this shop and are in stock
    const productIds = input.items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    if (dbProducts.length !== productIds.length) {
      throw { statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'One or more requested products do not exist' };
    }

    // Create lookup map
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let calculatedSubtotal = 0;
    const validatedItems: {
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
    }[] = [];

    for (const item of input.items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        throw { statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: `Product ${item.productId} not found` };
      }

      if (prod.shopId !== input.shopId) {
        throw {
          statusCode: 400,
          code: 'CROSS_SHOP_PRODUCT',
          message: `Product "${prod.name}" does not belong to the selected shop`,
        };
      }

      if (!prod.isAvailable) {
        throw {
          statusCode: 400,
          code: 'PRODUCT_UNAVAILABLE',
          message: `Product "${prod.name}" is currently marked unavailable`,
        };
      }

      if (prod.stock < item.quantity) {
        throw {
          statusCode: 400,
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock for "${prod.name}". Available: ${prod.stock}, requested: ${item.quantity}`,
        };
      }

      const lineTotal = Math.round(prod.price * item.quantity * 100) / 100;
      calculatedSubtotal += lineTotal;

      validatedItems.push({
        productId: prod.id,
        productName: prod.name,
        unitPrice: prod.price,
        quantity: item.quantity,
        totalPrice: lineTotal,
      });
    }

    calculatedSubtotal = Math.round(calculatedSubtotal * 100) / 100;
    const totalAmount = calculatedSubtotal; // Zero added tax for village pickup
    const orderNumber = this.generateOrderNumber();
    const pickupCode = this.generatePickupCode();

    // 3. Database transaction: create order, create order items, decrement stock, log event
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          shopId: input.shopId,
          customerId,
          status: 'PENDING' as any,
          pickupCode,
          subtotalAmount: calculatedSubtotal,
          totalAmount,
          taxAmount: 0,
          paymentMethod: input.paymentMethod as any,
          paymentStatus: 'PENDING' as any,
          notes: input.notes?.trim() || null,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              totalPrice: item.totalPrice,
            })),
          },
          events: {
            create: {
              fromStatus: null,
              toStatus: 'PENDING',
              actorId: customerId,
              notes: 'Order placed by customer for village store pickup',
            },
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
              phone: true,
            },
          },
          events: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Decrement product inventory safely
      for (const item of input.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      return newOrder;
    });

    return order;
  }

  /**
   * Get orders for the logged-in customer
   */
  static async getCustomerOrders(customerId: string, status?: string) {
    const where: any = { customerId };
    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            village: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                unit: true,
                category: true,
                imageUrl: true,
              },
            },
          },
        },
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  /**
   * Get single order details (authorized for order customer, shop member, or admin)
   */
  static async getOrderById(orderId: string, userId: string, userRole: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            village: true,
            district: true,
            phone: true,
            openingHours: true,
            closingHours: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                unit: true,
                category: true,
                imageUrl: true,
              },
            },
          },
        },
        events: {
          include: {
            actor: {
              select: {
                id: true,
                role: true,
                customerProfile: { select: { fullName: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        customer: {
          select: {
            id: true,
            phone: true,
            email: true,
            customerProfile: { select: { fullName: true, village: true } },
          },
        },
      },
    });

    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' };
    }

    // Access control: Customer can view their own order
    if (order.customerId === userId) {
      return order;
    }

    // Admin can view any order
    if (userRole === 'ADMIN') {
      return order;
    }

    // Shopkeeper / staff can view if they are an active member of this shop
    const membership = await prisma.shopMember.findUnique({
      where: {
        shopId_userId: {
          shopId: order.shopId,
          userId,
        },
      },
    });

    if (!membership) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'You are not authorized to view this order' };
    }

    return order;
  }

  /**
   * Get orders for shops managed by the shopkeeper
   */
  static async getShopkeeperOrders(userId: string, query: { shopId?: string; status?: string }) {
    // 1. Find all shops where user is a member
    const memberships = await prisma.shopMember.findMany({
      where: { userId },
      select: { shopId: true },
    });

    if (memberships.length === 0) {
      return { orders: [], managedShopIds: [] };
    }

    const managedShopIds = memberships.map((m) => m.shopId);

    // If specific shopId provided, ensure user is a member of it
    if (query.shopId && !managedShopIds.includes(query.shopId)) {
      throw { statusCode: 403, code: 'NOT_SHOP_MEMBER', message: 'You are not authorized to view orders for this shop' };
    }

    const where: any = {
      shopId: query.shopId ? query.shopId : { in: managedShopIds },
    };

    if (query.status) {
      where.status = query.status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            village: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                unit: true,
                category: true,
                imageUrl: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            phone: true,
            email: true,
            customerProfile: { select: { fullName: true } },
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { orders, managedShopIds };
  }

  /**
   * Shopkeeper updates order status:
   * Lifecycle: PENDING -> ACCEPTED -> PREPARING -> READY_FOR_PICKUP
   * Or: PENDING -> REJECTED (restores inventory)
   */
  static async updateOrderStatus(orderId: string, userId: string, input: UpdateOrderStatusInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' };
    }

    // Verify shopkeeper membership
    const membership = await prisma.shopMember.findUnique({
      where: {
        shopId_userId: {
          shopId: order.shopId,
          userId,
        },
      },
    });

    if (!membership) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only authorized shop staff can update order status' };
    }

    const currentStatus = order.status;
    const targetStatus = input.status;

    // Strict status transition validation
    const validTransitions: Record<string, string[]> = {
      PENDING: ['ACCEPTED', 'REJECTED'],
      ACCEPTED: ['PREPARING'],
      PREPARING: ['READY_FOR_PICKUP'],
      READY_FOR_PICKUP: [], // Only via verifyPickup!
      REJECTED: [],
      COLLECTED: [],
      COMPLETED: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw {
        statusCode: 400,
        code: 'INVALID_STATUS_TRANSITION',
        message: `Cannot transition order status from ${currentStatus} to ${targetStatus}`,
      };
    }

    // Enforce that all items are packed before moving to READY_FOR_PICKUP
    if (targetStatus === 'READY_FOR_PICKUP') {
      const unpackedItems = order.items.filter((item) => !item.isPacked);
      if (unpackedItems.length > 0) {
        throw {
          statusCode: 400,
          code: 'ALL_ITEMS_MUST_BE_PACKED',
          message: `All items must be marked as packed before marking order ready for collection (${unpackedItems.length} of ${order.items.length} items remaining).`,
        };
      }
    }

    if (targetStatus === 'REJECTED' && (!input.rejectionReason || input.rejectionReason.trim().length < 3)) {
      throw {
        statusCode: 400,
        code: 'REJECTION_REASON_REQUIRED',
        message: 'A clear rejection reason of at least 3 characters is required when rejecting an order',
      };
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If rejecting, restore inventory
      if (targetStatus === 'REJECTED') {
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
              },
            });
          }
        }
      }

      const orderUpdated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: targetStatus as any,
          rejectionReason: targetStatus === 'REJECTED' ? input.rejectionReason?.trim() : null,
          events: {
            create: {
              fromStatus: currentStatus,
              toStatus: targetStatus,
              actorId: userId,
              notes:
                targetStatus === 'REJECTED'
                  ? `Order rejected by shopkeeper: ${input.rejectionReason?.trim()}`
                  : `Order moved to ${targetStatus} by shopkeeper`,
            },
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { unit: true },
              },
            },
          },
          shop: true,
          events: { orderBy: { createdAt: 'desc' } },
        },
      });

      return orderUpdated;
    });

    return updated;
  }

  /**
   * Shopkeeper marks an individual order item as packed / unpacked
   */
  static async packOrderItem(orderId: string, itemId: string, userId: string, isPacked: boolean) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { unit: true } },
          },
        },
      },
    });

    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' };
    }

    // Verify shopkeeper membership for this specific shop
    const membership = await prisma.shopMember.findUnique({
      where: {
        shopId_userId: {
          shopId: order.shopId,
          userId,
        },
      },
    });

    if (!membership) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only authorized shop staff can pack items for this shop' };
    }

    // Can only pack when order is ACCEPTED or PREPARING
    if (order.status !== 'ACCEPTED' && order.status !== 'PREPARING') {
      throw {
        statusCode: 400,
        code: 'INVALID_ORDER_STATUS_FOR_PACKING',
        message: `Items can only be packed when order is in ACCEPTED or PREPARING status. Current status: ${order.status}`,
      };
    }

    const targetItem = order.items.find((i) => i.id === itemId);
    if (!targetItem) {
      throw { statusCode: 404, code: 'ITEM_NOT_FOUND', message: 'Order item not found in this order' };
    }

    // Update item and auto-transition order to PREPARING if it was ACCEPTED
    const result = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.orderItem.update({
        where: { id: itemId },
        data: {
          isPacked,
          packedAt: isPacked ? new Date() : null,
        },
        include: {
          product: { select: { unit: true } },
        },
      });

      let updatedOrderStatus = order.status;
      if (order.status === 'ACCEPTED' && isPacked) {
        updatedOrderStatus = 'PREPARING';
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'PREPARING' as any },
        });
        await tx.orderEvent.create({
          data: {
            orderId,
            fromStatus: 'ACCEPTED',
            toStatus: 'PREPARING',
            actorId: userId,
            notes: `Started packing items: "${targetItem.productName}" marked packed`,
          },
        });
      }

      // Fetch all items to get updated packed summary
      const allItems = await tx.orderItem.findMany({
        where: { orderId },
        include: { product: { select: { unit: true } } },
      });

      const packedCount = allItems.filter((i) => i.isPacked).length;
      const totalCount = allItems.length;
      const allPacked = packedCount === totalCount;

      return {
        item: updatedItem,
        orderId,
        orderStatus: updatedOrderStatus,
        packingProgress: {
          packedCount,
          totalCount,
          allPacked,
        },
        items: allItems,
      };
    });

    return result;
  }

  /**
   * Shopkeeper confirms pickup using the customer's secure pickup code
   * Status transitions to COLLECTED and paymentStatus to PAID
   * Idempotent: If already COLLECTED, returns success safely
   */
  static async verifyPickupAndCollect(orderId: string, userId: string, input: VerifyPickupInput) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found' };
    }

    // Verify shopkeeper membership
    const membership = await prisma.shopMember.findUnique({
      where: {
        shopId_userId: {
          shopId: order.shopId,
          userId,
        },
      },
    });

    if (!membership) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only authorized shop staff can verify and complete pickup' };
    }

    // Idempotency check: If already collected, return current state without error
    if (order.status === 'COLLECTED' || order.status === 'COMPLETED') {
      return { order, alreadyCollected: true };
    }

    // Must be READY_FOR_PICKUP before collection
    if (order.status !== 'READY_FOR_PICKUP') {
      throw {
        statusCode: 400,
        code: 'ORDER_NOT_READY',
        message: `Order must be in READY_FOR_PICKUP status before collection. Current status: ${order.status}`,
      };
    }

    // Validate secret pickup code
    const enteredCode = input.pickupCode.trim();
    if (!order.pickupCode || order.pickupCode !== enteredCode) {
      throw {
        statusCode: 400,
        code: 'INVALID_PICKUP_CODE',
        message: 'Invalid pickup verification code. Please check the 6-digit code on customer screen.',
      };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const finalized = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COLLECTED' as any,
          paymentStatus: 'PAID' as any, // Payment received at pickup
          events: {
            create: {
              fromStatus: 'READY_FOR_PICKUP',
              toStatus: 'COLLECTED',
              actorId: userId,
              notes: 'Order verified with 6-digit code and handed over to customer. Payment collected.',
            },
          },
        },
        include: {
          items: true,
          shop: true,
          events: { orderBy: { createdAt: 'desc' } },
        },
      });

      return finalized;
    });

    return { order: updated, alreadyCollected: false };
  }
}
