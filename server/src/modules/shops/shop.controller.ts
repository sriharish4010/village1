import { Request, Response, NextFunction } from 'express';
import { ShopService } from './shop.service.js';
import { apiSuccess, apiError } from '../../utils/response.js';
import { AuthRequest } from '../../middleware/auth.js';

export class ShopController {
  static async registerShop(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }
      const ip = req.ip || req.socket.remoteAddress;
      const ua = req.headers['user-agent'];
      const shop = await ShopService.registerShop(req.user.userId, req.body, ip, ua);
      return apiSuccess(res, { shop }, 201);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  static async getMyShops(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }
      const shops = await ShopService.getMyShops(req.user.userId);
      return apiSuccess(res, { shops }, 200);
    } catch (error) {
      return next(error);
    }
  }

  static async getPublicShops(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ShopService.getPublicShops(req.query as any);
      return apiSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  static async getShopById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requestingUser = req.user
        ? { userId: req.user.userId, role: req.user.role }
        : undefined;
      const shop = await ShopService.getShopById(id, requestingUser);
      return apiSuccess(res, { shop }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await ShopService.getCategories();
      return apiSuccess(res, { categories }, 200);
    } catch (error) {
      return next(error);
    }
  }

  static async getShopProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      const { search, sort } = req.query as any;
      const result = await ShopService.getShopProducts(shopId, { search, sort });
      return apiSuccess(res, result, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }
}

