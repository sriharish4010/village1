import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { apiSuccess, apiError } from '../../utils/response.js';
import { AuthRequest } from '../../middleware/auth.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await AuthService.register(req.body, ipAddress, userAgent);
      return apiSuccess(res, result, 201);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await AuthService.login(req.body, ipAddress, userAgent);
      return apiSuccess(res, result, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      return apiSuccess(res, result, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.userId;
      const result = await AuthService.logout(refreshToken, userId);
      return apiSuccess(res, result, 200);
    } catch (error: any) {
      return next(error);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return apiError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
      }
      const user = await AuthService.getCurrentUser(req.user.userId);
      return apiSuccess(res, { user }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return apiError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
      }
      const profile = await AuthService.updateProfile(req.user.userId, req.body);
      return apiSuccess(res, { profile }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }
}
