import { Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';
import { apiSuccess, apiError } from '../../utils/response.js';
import { AuthRequest } from '../../middleware/auth.js';

export class AdminController {
  static async getPlatformStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getPlatformStats();
      return apiSuccess(res, { stats }, 200);
    } catch (error) {
      return next(error);
    }
  }

  static async getShops(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getShops(req.query as any);
      return apiSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  static async getShopDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const shop = await AdminService.getShopDetails(id);
      return apiSuccess(res, { shop }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  static async approveShop(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const ua = req.headers['user-agent'];
      const shop = await AdminService.approveShop(req.user!.userId, id, ip, ua);
      return apiSuccess(res, { shop, message: 'Shop application approved successfully' }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  static async rejectShop(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const ua = req.headers['user-agent'];
      const shop = await AdminService.rejectShop(req.user!.userId, id, reason, ip, ua);
      return apiSuccess(res, { shop, message: 'Shop application rejected' }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  static async suspendShop(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const ua = req.headers['user-agent'];
      const shop = await AdminService.suspendShop(req.user!.userId, id, reason, ip, ua);
      return apiSuccess(res, { shop, message: 'Shop suspended' }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  static async reactivateShop(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ip = req.ip || req.socket.remoteAddress;
      const ua = req.headers['user-agent'];
      const shop = await AdminService.reactivateShop(req.user!.userId, id, ip, ua);
      return apiSuccess(res, { shop, message: 'Shop reactivated successfully' }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  static async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getUsers(req.query as any);
      return apiSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }

  static async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive, reason } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const ua = req.headers['user-agent'];
      const user = await AdminService.updateUserStatus(req.user!.userId, id, isActive, reason, ip, ua);
      return apiSuccess(res, { user, message: `User account ${isActive ? 'activated' : 'deactivated'} successfully` }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  static async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '25', 10);
      const result = await AdminService.getAuditLogs(page, limit);
      return apiSuccess(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }
}
