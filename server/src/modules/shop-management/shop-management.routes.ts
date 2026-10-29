import { Router } from 'express';
import { ShopManagementController } from './shop-management.controller.js';
import { authenticateToken, requireRole, requireShopMember } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
  createPosBillSchema,
  updatePosDraftBillSchema,
  finalizePosDraftBillSchema,
  voidPosBillSchema,
  shopItemQuerySchema,
  salesFilterQuerySchema,
  inventoryHistoryQuerySchema,
} from './inventory.validator.js';

const router = Router();

// All shop management routes require:
// 1. Authenticated User
// 2. Either SHOPKEEPER or ADMIN role
// 3. Authorized membership in the specific shop (or ADMIN)
router.use(authenticateToken);
router.use(requireRole('SHOPKEEPER', 'ADMIN'));

// Products / Items management
router.get(
  '/:shopId/items',
  requireShopMember('shopId'),
  validate(shopItemQuerySchema),
  ShopManagementController.getItems
);

router.post(
  '/:shopId/items',
  requireShopMember('shopId', ['OWNER', 'MANAGER']),
  validate(createProductSchema),
  ShopManagementController.createItem
);

router.put(
  '/:shopId/items/:productId',
  requireShopMember('shopId', ['OWNER', 'MANAGER']),
  validate(updateProductSchema),
  ShopManagementController.updateItem
);

router.post(
  '/:shopId/items/:productId/adjust-stock',
  requireShopMember('shopId', ['OWNER', 'MANAGER', 'STAFF']),
  validate(adjustStockSchema),
  ShopManagementController.adjustStock
);

// Inventory overview & movements
router.get(
  '/:shopId/inventory',
  requireShopMember('shopId'),
  ShopManagementController.getInventory
);

router.get(
  '/:shopId/inventory/history',
  requireShopMember('shopId'),
  validate(inventoryHistoryQuerySchema),
  ShopManagementController.getInventoryLogs
);

// Billing / POS
router.post(
  '/:shopId/pos/bills',
  requireShopMember('shopId', ['OWNER', 'MANAGER', 'STAFF']),
  validate(createPosBillSchema),
  ShopManagementController.createPosBill
);

router.put(
  '/:shopId/pos/bills/:billId',
  requireShopMember('shopId', ['OWNER', 'MANAGER', 'STAFF']),
  validate(updatePosDraftBillSchema),
  ShopManagementController.updatePosDraftBill
);

router.post(
  '/:shopId/pos/bills/:billId/finalize',
  requireShopMember('shopId', ['OWNER', 'MANAGER', 'STAFF']),
  validate(finalizePosDraftBillSchema),
  ShopManagementController.finalizePosDraftBill
);

router.post(
  '/:shopId/pos/bills/:billId/void',
  requireShopMember('shopId', ['OWNER', 'MANAGER']),
  validate(voidPosBillSchema),
  ShopManagementController.voidPosBill
);

// Sales History
router.get(
  '/:shopId/sales',
  requireShopMember('shopId'),
  validate(salesFilterQuerySchema),
  ShopManagementController.getSales
);

// Reports
router.get(
  '/:shopId/reports',
  requireShopMember('shopId'),
  ShopManagementController.getReports
);

export default router;
