import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { ShopManagementService } from './shop-management.service.js';
import { apiSuccess } from '../../utils/response.js';

export class ShopManagementController {
  /**
   * Get items list for shopkeeper
   */
  static async getItems(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      const result = await ShopManagementService.getShopItems(shopId, req.query as any);
      return apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add new item
   */
  static async createItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      const product = await ShopManagementService.createItem(shopId, req.user!.userId, req.body);
      return apiSuccess(res, { product, message: 'Item created successfully' }, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update item
   */
  static async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId, productId } = req.params;
      const product = await ShopManagementService.updateItem(shopId, productId, req.user!.userId, req.body);
      return apiSuccess(res, { product, message: 'Item updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Adjust stock with reason
   */
  static async adjustStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId, productId } = req.params;
      const { delta, reason } = req.body;
      const result = await ShopManagementService.adjustStock(shopId, productId, req.user!.userId, delta, reason);
      return apiSuccess(res, {
        product: result.product,
        log: result.log,
        message: 'Stock updated and movement recorded successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Inventory overview with valuation and low-stock indicators
   */
  static async getInventory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      const result = await ShopManagementService.getInventoryOverview(shopId);
      return apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Inventory movement logs
   */
  static async getInventoryLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      const result = await ShopManagementService.getInventoryHistory(shopId, req.query as any);
      return apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create POS Bill
   */
  static async createPosBill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      const bill = await ShopManagementService.createPosBill(shopId, req.user!.userId, req.body);
      return apiSuccess(
        res,
        {
          bill,
          message:
            bill.status === 'DRAFT'
              ? 'Draft bill saved successfully'
              : 'Bill finalized and inventory updated successfully',
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update Draft POS Bill
   */
  static async updatePosDraftBill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId, billId } = req.params;
      const bill = await ShopManagementService.updatePosDraftBill(shopId, billId, req.user!.userId, req.body);
      return apiSuccess(res, { bill, message: 'Draft bill updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Finalize Draft POS Bill
   */
  static async finalizePosDraftBill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId, billId } = req.params;
      const bill = await ShopManagementService.finalizePosDraftBill(shopId, billId, req.user!.userId, req.body);
      return apiSuccess(res, { bill, message: 'Bill finalized and inventory updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Void POS Bill
   */
  static async voidPosBill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId, billId } = req.params;
      const { reason } = req.body;
      const bill = await ShopManagementService.voidPosBill(shopId, billId, req.user!.userId, reason);
      return apiSuccess(res, { bill, message: 'Bill voided and inventory restored successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Sales History
   */
  static async getSales(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      const result = await ShopManagementService.getSalesHistory(shopId, req.query as any);
      return apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Sales and Inventory Reports
   */
  static async getReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      const result = await ShopManagementService.getSalesReport(shopId, req.query as any);
      return apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
