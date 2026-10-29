import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { apiError } from '../utils/response.js';
import { prisma } from '../config/prisma.js';

export interface AuthenticatedUser extends TokenPayload {
  isActive: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return apiError(res, 'Authentication required: missing or malformed Bearer token', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);

    // Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, email: true, phone: true, isActive: true },
    });

    if (!user) {
      return apiError(res, 'User session invalid or user deleted', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      return apiError(res, 'Your account has been deactivated. Please contact support.', 403, 'ACCOUNT_DEACTIVATED');
    }

    req.user = {
      userId: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
    };

    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return apiError(res, 'Access token has expired. Please refresh your session.', 401, 'TOKEN_EXPIRED');
    }
    return apiError(res, 'Invalid access token', 401, 'INVALID_TOKEN');
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return apiError(
        res,
        `Access denied. Required permission role: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
        403,
        'FORBIDDEN'
      );
    }

    return next();
  };
}

export function requireShopMember(paramName = 'shopId', allowedRoles: string[] = ['OWNER', 'MANAGER', 'STAFF']) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    // Admins have global permission
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const shopId = req.params[paramName] || req.body[paramName] || (req.query[paramName] as string);
    if (!shopId) {
      return apiError(res, `Missing ${paramName} parameter for authorization check`, 400, 'MISSING_SHOP_ID');
    }

    const membership = await prisma.shopMember.findUnique({
      where: {
        shopId_userId: {
          shopId,
          userId: req.user.userId,
        },
      },
    });

    if (!membership) {
      return apiError(res, 'You are not an authorized member of this shop', 403, 'SHOP_MEMBERSHIP_REQUIRED');
    }

    if (!allowedRoles.includes(membership.role)) {
      return apiError(
        res,
        `Insufficient shop permissions. Required: [${allowedRoles.join(', ')}], Current: ${membership.role}`,
        403,
        'INSUFFICIENT_SHOP_PERMISSIONS'
      );
    }

    return next();
  };
}
