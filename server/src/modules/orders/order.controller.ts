import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { OrderService } from './order.service.js';
import { apiSuccess, apiError } from '../../utils/response.js';

export class OrderController {
  /**
   * POST /api/v1/orders
   * Customer creates a new pickup order
   */
  static async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }

      const order = await OrderService.createOrder(req.user.userId, req.body);
      return apiSuccess(res, { order }, 201);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  /**
   * GET /api/v1/orders/my-orders
   * Customer views their order history
   */
  static async getCustomerOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }

      const status = req.query.status as string | undefined;
      const orders = await OrderService.getCustomerOrders(req.user.userId, status);
      return apiSuccess(res, { orders }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  /**
   * GET /api/v1/orders/shop-orders
   * Shopkeeper views incoming/active orders for their managed shops
   */
  static async getShopkeeperOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }

      const shopId = req.query.shopId as string | undefined;
      const status = req.query.status as string | undefined;
      const result = await OrderService.getShopkeeperOrders(req.user.userId, { shopId, status });
      return apiSuccess(res, result, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  /**
   * GET /api/v1/orders/:orderId
   * Get single order details with events timeline
   */
  static async getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }

      const { orderId } = req.params;
      const order = await OrderService.getOrderById(orderId, req.user.userId, req.user.role);
      return apiSuccess(res, { order }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  /**
   * PUT /api/v1/orders/:orderId/status
   * Shopkeeper updates order status (ACCEPTED, PREPARING, READY_FOR_PICKUP, REJECTED)
   */
  static async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }

      const { orderId } = req.params;
      const updatedOrder = await OrderService.updateOrderStatus(orderId, req.user.userId, req.body);
      return apiSuccess(res, { order: updatedOrder }, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  /**
   * POST /api/v1/orders/:orderId/verify-pickup
   * Shopkeeper enters customer's 6-digit pickup code to confirm handover and payment
   */
  static async verifyPickupAndCollect(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }

      const { orderId } = req.params;
      const result = await OrderService.verifyPickupAndCollect(orderId, req.user.userId, req.body);
      return apiSuccess(res, result, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }

  /**
   * PUT /api/v1/orders/:orderId/items/:itemId/pack
   * Shopkeeper marks individual order item as packed / unpacked
   */
  static async packOrderItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return apiError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      }

      const { orderId, itemId } = req.params;
      const { isPacked } = req.body;
      const result = await OrderService.packOrderItem(orderId, itemId, req.user.userId, isPacked);
      return apiSuccess(res, result, 200);
    } catch (error: any) {
      if (error.statusCode) {
        return apiError(res, error.message, error.statusCode, error.code);
      }
      return next(error);
    }
  }
}
