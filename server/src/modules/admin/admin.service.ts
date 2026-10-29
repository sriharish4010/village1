import { prisma } from '../../config/prisma.js';

export class AdminService {
  /**
   * Platform Overview Statistics
   * Note: Only genuine database counts are returned.
   * If platform-fee / online-payment revenue is not implemented or has no transactions,
   * it returns explicit unavailable status rather than fabricated numbers.
   */
  static async getPlatformStats() {
    const [
      totalUsers,
      totalCustomers,
      totalShopkeepers,
      totalAdmins,
      totalShops,
      pendingShops,
      approvedShops,
      rejectedShops,
      suspendedShops,
      totalOrders,
      totalAppointments,
      actualPaymentsCount,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'SHOPKEEPER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.shop.count(),
      prisma.shop.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.shop.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.shop.count({ where: { verificationStatus: 'REJECTED' } }),
      prisma.shop.count({ where: { verificationStatus: 'SUSPENDED' } }),
      prisma.order.count(),
      prisma.appointment.count(),
      prisma.payment.count(),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
              customerProfile: { select: { fullName: true } },
            },
          },
        },
      }),
    ]);

    // Platform revenue calculation strictly from actual completed payments if any exist
    let platformRevenue: { amount: number | null; status: string; description: string } = {
      amount: null,
      status: 'NOT_CONFIGURED',
      description: 'Zero-commission pilot phase: platform fees and online commission billing are not enabled.',
    };

    if (actualPaymentsCount > 0) {
      const paymentSum = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      });
      platformRevenue = {
        amount: paymentSum._sum.amount || 0,
        status: 'ACTIVE',
        description: 'Total settled payment volume in database.',
      };
    }

    return {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        shopkeepers: totalShopkeepers,
        admins: totalAdmins,
      },
      shops: {
        total: totalShops,
        pending: pendingShops,
        approved: approvedShops,
        rejected: rejectedShops,
        suspended: suspendedShops,
      },
      orders: {
        total: totalOrders,
        status: totalOrders > 0 ? 'ACTIVE' : 'READY_NO_ORDERS_YET',
      },
      appointments: {
        total: totalAppointments,
        status: totalAppointments > 0 ? 'ACTIVE' : 'READY_NO_APPOINTMENTS_YET',
      },
      revenue: platformRevenue,
      recentActivity: recentAuditLogs,
    };
  }

  /**
   * Search and filter all shops in platform
   */
  static async getShops(query: {
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
    village?: string;
    categoryId?: string;
  }) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status && query.status !== 'ALL') {
      where.verificationStatus = query.status;
    }

    if (query.village) {
      where.village = { contains: query.village };
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { village: { contains: query.search } },
        { phone: { contains: query.search } },
      ];
    }

    const [total, shops] = await Promise.all([
      prisma.shop.count({ where }),
      prisma.shop.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          members: {
            where: { role: 'OWNER' },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  phone: true,
                  customerProfile: { select: { fullName: true } },
                },
              },
            },
          },
          _count: {
            select: {
              products: true,
              services: true,
              orders: true,
              appointments: true,
              members: true,
            },
          },
        },
        orderBy: [{ verificationStatus: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      shops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get full shop details for administrative review
   */
  static async getShopDetails(shopId: string) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        category: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                customerProfile: true,
              },
            },
          },
        },
        products: { take: 20 },
        services: { take: 20 },
        _count: {
          select: {
            products: true,
            services: true,
            orders: true,
            appointments: true,
          },
        },
      },
    });

    if (!shop) {
      throw { statusCode: 404, code: 'SHOP_NOT_FOUND', message: 'Shop not found' };
    }

    return shop;
  }

  /**
   * Approve a shop application
   */
  static async approveShop(adminUserId: string, shopId: string, ipAddress?: string, userAgent?: string) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw { statusCode: 404, code: 'SHOP_NOT_FOUND', message: 'Shop not found' };
    }

    const updatedShop = await prisma.$transaction(async (tx) => {
      const s = await tx.shop.update({
        where: { id: shopId },
        data: {
          verificationStatus: 'APPROVED' as any,
          approvedAt: new Date(),
          isActive: true,
          approvalReason: null,
        },
        include: { category: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'SHOP_APPROVED',
          entity: 'SHOP',
          entityId: shopId,
          details: JSON.stringify({ shopName: s.name, village: s.village }),
          ipAddress,
          userAgent,
        },
      });

      return s;
    });

    return updatedShop;
  }

  /**
   * Reject a shop application with clear reason
   */
  static async rejectShop(adminUserId: string, shopId: string, reason: string, ipAddress?: string, userAgent?: string) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw { statusCode: 404, code: 'SHOP_NOT_FOUND', message: 'Shop not found' };
    }

    const updatedShop = await prisma.$transaction(async (tx) => {
      const s = await tx.shop.update({
        where: { id: shopId },
        data: {
          verificationStatus: 'REJECTED' as any,
          approvalReason: reason.trim(),
          isActive: false, // Inactive
        },
        include: { category: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'SHOP_REJECTED',
          entity: 'SHOP',
          entityId: shopId,
          details: JSON.stringify({ shopName: s.name, reason: reason.trim() }),
          ipAddress,
          userAgent,
        },
      });

      return s;
    });

    return updatedShop;
  }

  /**
   * Suspend a previously approved shop
   */
  static async suspendShop(adminUserId: string, shopId: string, reason: string, ipAddress?: string, userAgent?: string) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw { statusCode: 404, code: 'SHOP_NOT_FOUND', message: 'Shop not found' };
    }

    const updatedShop = await prisma.$transaction(async (tx) => {
      const s = await tx.shop.update({
        where: { id: shopId },
        data: {
          verificationStatus: 'SUSPENDED' as any,
          approvalReason: reason.trim(),
          isActive: false, // Suspended shops cannot accept orders
        },
        include: { category: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'SHOP_SUSPENDED',
          entity: 'SHOP',
          entityId: shopId,
          details: JSON.stringify({ shopName: s.name, reason: reason.trim() }),
          ipAddress,
          userAgent,
        },
      });

      return s;
    });

    return updatedShop;
  }

  /**
   * Reactivate a suspended or rejected shop
   */
  static async reactivateShop(adminUserId: string, shopId: string, ipAddress?: string, userAgent?: string) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw { statusCode: 404, code: 'SHOP_NOT_FOUND', message: 'Shop not found' };
    }

    const updatedShop = await prisma.$transaction(async (tx) => {
      const s = await tx.shop.update({
        where: { id: shopId },
        data: {
          verificationStatus: 'APPROVED' as any,
          approvalReason: null,
          isActive: true,
        },
        include: { category: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'SHOP_REACTIVATED',
          entity: 'SHOP',
          entityId: shopId,
          details: JSON.stringify({ shopName: s.name }),
          ipAddress,
          userAgent,
        },
      });

      return s;
    });

    return updatedShop;
  }

  /**
   * Search and filter all registered users
   */
  static async getUsers(query: {
    page?: string;
    limit?: string;
    role?: string;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.role && query.role !== 'ALL') {
      where.role = query.role;
    }

    if (query.status && query.status !== 'ALL') {
      where.isActive = query.status === 'ACTIVE';
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { phone: { contains: query.search } },
        { customerProfile: { fullName: { contains: query.search } } },
        { customerProfile: { village: { contains: query.search } } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          customerProfile: true,
          _count: {
            select: {
              shopMemberships: true,
              orders: true,
              appointments: true,
              addresses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Activate or Deactivate a user account
   * Security guard: Admin cannot deactivate their own account or remove the last active admin!
   */
  static async updateUserStatus(
    adminUserId: string,
    targetUserId: string,
    isActive: boolean,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    if (adminUserId === targetUserId && !isActive) {
      throw {
        statusCode: 400,
        code: 'SELF_DEACTIVATION_NOT_ALLOWED',
        message: 'Security policy error: Administrators cannot deactivate their own account',
      };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'Target user not found' };
    }

    // Guard against deactivating the last active administrator
    if (targetUser.role === 'ADMIN' && !isActive) {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdminCount <= 1) {
        throw {
          statusCode: 400,
          code: 'LAST_ADMIN_PROTECTION',
          message: 'Security policy error: Cannot deactivate the last active administrator on the platform',
        };
      }
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: { isActive },
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          customerProfile: true,
        },
      });

      // If deactivating user, revoke all active refresh tokens immediately
      if (!isActive) {
        await tx.refreshToken.updateMany({
          where: { userId: targetUserId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          entity: 'USER',
          entityId: targetUserId,
          details: JSON.stringify({ reason: reason.trim(), newStatus: isActive }),
          ipAddress,
          userAgent,
        },
      });

      return u;
    });

    return updatedUser;
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(page = 1, limit = 25) {
    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
              customerProfile: { select: { fullName: true } },
            },
          },
        },
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
}
