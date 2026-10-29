import { prisma } from '../../config/prisma.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from '../../utils/jwt.js';
import { RegisterInput, LoginInput, UpdateProfileInput } from './auth.validator.js';

export class AuthService {
  /**
   * Register a new customer or shopkeeper
   */
  static async register(input: RegisterInput, ipAddress?: string, userAgent?: string) {
    const email = input.email ? input.email.toLowerCase().trim() : null;
    const phone = input.phone ? input.phone.trim() : null;

    // Check duplicate email
    if (email) {
      const existingEmail = await prisma.user.findFirst({ where: { email } });
      if (existingEmail) {
        throw { statusCode: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email address already exists' };
      }
    }

    // Check duplicate phone
    if (phone) {
      const existingPhone = await prisma.user.findFirst({ where: { phone } });
      if (existingPhone) {
        throw { statusCode: 409, code: 'PHONE_ALREADY_EXISTS', message: 'An account with this mobile number already exists' };
      }
    }

    const passwordHash = await hashPassword(input.password);

    // Database transaction to create user, profile, and initial address
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          role: input.role as any,
          isActive: true,
          customerProfile: {
            create: {
              fullName: input.fullName.trim(),
              village: input.village.trim(),
              district: input.district.trim(),
              state: input.state?.trim() || 'Tamil Nadu',
              pinCode: input.pinCode.trim(),
              preferredLanguage: input.preferredLanguage || 'en',
            },
          },
          addresses: {
            create: {
              addressLine: `${input.fullName}, ${input.village}`,
              village: input.village.trim(),
              district: input.district.trim(),
              state: input.state?.trim() || 'Tamil Nadu',
              pinCode: input.pinCode.trim(),
              isDefault: true,
            },
          },
        },
        include: {
          customerProfile: true,
        },
      });

      // Generate access & refresh tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role,
        email: user.email,
        phone: user.phone,
      });

      const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken();

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          entity: 'USER',
          entityId: user.id,
          details: JSON.stringify({ role: user.role, village: input.village }),
          ipAddress,
          userAgent,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          customerProfile: user.customerProfile,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '15m',
        },
      };
    });

    return result;
  }

  /**
   * Log in with email or phone number
   */
  static async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const identifier = input.identifier.trim();
    const isEmail = identifier.includes('@');

    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: identifier.toLowerCase() }
        : { phone: identifier },
      include: {
        customerProfile: true,
        shopMemberships: {
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                slug: true,
                verificationStatus: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please verify your email/phone and password.' };
    }

    if (!user.isActive) {
      throw { statusCode: 403, code: 'ACCOUNT_DEACTIVATED', message: 'Your account has been deactivated. Please contact support.' };
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please verify your email/phone and password.' };
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
    });

    const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Record login in audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'USER',
        entityId: user.id,
        details: JSON.stringify({ method: isEmail ? 'email' : 'phone' }),
        ipAddress,
        userAgent,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        customerProfile: user.customerProfile,
        shopMemberships: user.shopMemberships,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '15m',
      },
    };
  }

  /**
   * Rotate refresh token and issue new access token
   */
  static async refreshToken(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { customerProfile: true },
        },
      },
    });

    if (!storedToken) {
      throw { statusCode: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or unrecognized refresh token' };
    }

    if (storedToken.revokedAt) {
      // Security: Reuse detection! If a revoked token is used, revoke all tokens for this user
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revokedAt: new Date() },
      });
      throw {
        statusCode: 401,
        code: 'TOKEN_REUSE_DETECTED',
        message: 'Security breach detected: refresh token reuse. Please log in again.',
      };
    }

    if (new Date() > storedToken.expiresAt) {
      throw { statusCode: 401, code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token has expired. Please log in again.' };
    }

    if (!storedToken.user.isActive) {
      throw { statusCode: 403, code: 'ACCOUNT_DEACTIVATED', message: 'Account is deactivated' };
    }

    // Revoke current token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Issue new pair
    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      role: storedToken.user.role,
      email: storedToken.user.email,
      phone: storedToken.user.phone,
    });

    const { token: newRefreshToken, tokenHash: newTokenHash, expiresAt } = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        tokenHash: newTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: '15m',
    };
  }

  /**
   * Log out and revoke refresh token
   */
  static async logout(rawRefreshToken?: string, userId?: string) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    } else if (userId) {
      // Revoke all tokens for user
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Get authenticated user profile with active shops
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        shopMemberships: {
          include: {
            shop: {
              include: {
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      customerProfile: user.customerProfile,
      addresses: user.addresses,
      shops: user.shopMemberships.map((m) => ({
        membershipId: m.id,
        role: m.role,
        permissions: m.permissions.split(','),
        shop: m.shop,
      })),
    };
  }

  /**
   * Update profile
   */
  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const profile = await prisma.customerProfile.upsert({
      where: { userId },
      update: {
        ...(input.fullName ? { fullName: input.fullName.trim() } : {}),
        ...(input.village ? { village: input.village.trim() } : {}),
        ...(input.district ? { district: input.district.trim() } : {}),
        ...(input.state ? { state: input.state.trim() } : {}),
        ...(input.pinCode ? { pinCode: input.pinCode.trim() } : {}),
        ...(input.preferredLanguage ? { preferredLanguage: input.preferredLanguage } : {}),
      },
      create: {
        userId,
        fullName: input.fullName || 'User',
        village: input.village || '',
        district: input.district || '',
        state: input.state || 'Tamil Nadu',
        pinCode: input.pinCode || '',
        preferredLanguage: input.preferredLanguage || 'en',
      },
    });

    return profile;
  }
}
