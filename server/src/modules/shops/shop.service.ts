import { prisma } from '../../config/prisma.js';
import { CreateShopInput, UpdateShopInput } from './shop.validator.js';

export class ShopService {
  /**
   * Register a new shop or branch
   * Initially created with PENDING verification and inactive status.
   */
  static async registerShop(userId: string, input: CreateShopInput, ipAddress?: string, userAgent?: string) {
    // Verify category exists
    const category = await prisma.shopCategory.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      throw { statusCode: 404, code: 'CATEGORY_NOT_FOUND', message: 'The selected shop category does not exist' };
    }

    // Generate unique slug
    const baseSlug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${input.village.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${randomSuffix}`;

    const shop = await prisma.$transaction(async (tx) => {
      // 1. Create the shop
      const createdShop = await tx.shop.create({
        data: {
          name: input.name.trim(),
          slug,
          categoryId: input.categoryId,
          description: input.description?.trim(),
          address: input.address.trim(),
          village: input.village.trim(),
          district: input.district.trim(),
          state: input.state?.trim() || 'Tamil Nadu',
          pinCode: input.pinCode.trim(),
          phone: input.phone.trim(),
          email: input.email ? input.email.trim().toLowerCase() : null,
          openingHours: input.openingHours,
          closingHours: input.closingHours,
          weeklyHoliday: input.weeklyHoliday || 'None',
          pickupInstructions: input.pickupInstructions?.trim(),
          policies: input.policies?.trim(),
          verificationStatus: 'PENDING' as any,
          isActive: false, // Inactive until approved by administrator
        },
        include: {
          category: true,
        },
      });

      // 2. Add owner membership
      await tx.shopMember.create({
        data: {
          shopId: createdShop.id,
          userId,
          role: 'OWNER' as any,
          permissions: 'orders,inventory,staff,reports,settings',
        },
      });

      // 3. Promote customer to shopkeeper if not already shopkeeper or admin
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user && user.role === 'CUSTOMER') {
        await tx.user.update({
          where: { id: userId },
          data: { role: 'SHOPKEEPER' as any },
        });
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'SHOP_REGISTERED',
          entity: 'SHOP',
          entityId: createdShop.id,
          details: JSON.stringify({ name: createdShop.name, village: createdShop.village, status: 'PENDING' }),
          ipAddress,
          userAgent,
        },
      });

      return createdShop;
    });

    return shop;
  }

  /**
   * Get all shops where the user is an authorized member
   */
  static async getMyShops(userId: string) {
    const memberships = await prisma.shopMember.findMany({
      where: { userId },
      include: {
        shop: {
          include: {
            category: true,
            _count: {
              select: {
                products: true,
                services: true,
                orders: true,
                members: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      role: m.role,
      permissions: m.permissions.split(','),
      shop: m.shop,
    }));
  }

  /**
   * Public shops listing: ONLY approved and active shops are returned!
   */
  static async getPublicShops(query: { page?: string; limit?: string; village?: string; categoryId?: string; search?: string }) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      verificationStatus: 'APPROVED',
      isActive: true,
    };

    if (query.village) {
      where.village = { contains: query.village };
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
        { village: { contains: query.search } },
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
          products: {
            where: { isAvailable: true, isArchived: false },
            take: 5,
            orderBy: { name: 'asc' },
          },
          services: {
            where: { isAvailable: true },
            take: 5,
            orderBy: { name: 'asc' },
          },
          _count: {
            select: {
              products: { where: { isAvailable: true } },
              services: { where: { isAvailable: true } },
              reviews: true,
            },
          },
        },
        orderBy: { name: 'asc' },
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
   * Get single shop details
   */
  static async getShopById(shopId: string, requestingUser?: { userId: string; role: string }) {
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
                customerProfile: { select: { fullName: true } },
              },
            },
          },
        },
        products: {
          where: { isAvailable: true, isArchived: false },
          take: 50,
        },
        services: {
          where: { isAvailable: true },
          take: 50,
        },
        _count: {
          select: {
            products: { where: { isAvailable: true, isArchived: false } },
            services: { where: { isAvailable: true } },
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!shop) {
      throw { statusCode: 404, code: 'SHOP_NOT_FOUND', message: 'Shop not found' };
    }

    // If shop is not approved or is inactive, only ADMIN or authorized shop member can view
    if (shop.verificationStatus !== 'APPROVED' || !shop.isActive) {
      const isMember = requestingUser && shop.members.some((m) => m.userId === requestingUser.userId);
      const isAdmin = requestingUser?.role === 'ADMIN';

      if (!isAdmin && !isMember) {
        throw {
          statusCode: 403,
          code: 'SHOP_NOT_PUBLIC',
          message: 'This shop is pending approval or inactive and is not publicly accessible',
        };
      }
    }

    return shop;
  }

  /**
   * Get shop categories
   */
  static async getCategories() {
    return prisma.shopCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            shops: {
              where: {
                verificationStatus: 'APPROVED',
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get all active products for a shop with search and sort
   */
  static async getShopProducts(shopId: string, query: { search?: string; sort?: string }) {
    // 1. Verify shop exists and is approved/active
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true, verificationStatus: true, isActive: true },
    });

    if (!shop) {
      throw { statusCode: 404, code: 'SHOP_NOT_FOUND', message: 'Shop not found' };
    }

    if (shop.verificationStatus !== 'APPROVED' || !shop.isActive) {
      throw { statusCode: 403, code: 'SHOP_NOT_PUBLIC', message: 'Shop is not currently active or approved' };
    }

    const where: any = {
      shopId,
      isAvailable: true,
      isArchived: false,
    };

    if (query.search && query.search.trim()) {
      where.OR = [
        { name: { contains: query.search.trim() } },
        { description: { contains: query.search.trim() } },
        { unit: { contains: query.search.trim() } },
      ];
    }

    let orderBy: any = { name: 'asc' };
    if (query.sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (query.sort === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (query.sort === 'name_desc') {
      orderBy = { name: 'desc' };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
    });

    return { shop, products };
  }
}

