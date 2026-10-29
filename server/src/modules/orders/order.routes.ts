import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  verifyPickupSchema,
  packOrderItemSchema,
  orderQuerySchema,
} from './order.validator.js';

const router = Router();

// All order endpoints require authentication
router.use(authenticateToken);

// Customer endpoints
router.post('/', validate(createOrderSchema), OrderController.createOrder);
router.get('/my-orders', validate(orderQuerySchema), OrderController.getCustomerOrders);

// Shopkeeper endpoints (strictly authorized to SHOPKEEPER and ADMIN)
router.get('/shop-orders', requireRole('SHOPKEEPER', 'ADMIN'), validate(orderQuerySchema), OrderController.getShopkeeperOrders);
router.put('/:orderId/status', requireRole('SHOPKEEPER', 'ADMIN'), validate(updateOrderStatusSchema), OrderController.updateOrderStatus);
router.put('/:orderId/items/:itemId/pack', requireRole('SHOPKEEPER', 'ADMIN'), validate(packOrderItemSchema), OrderController.packOrderItem);
router.post('/:orderId/verify-pickup', requireRole('SHOPKEEPER', 'ADMIN'), validate(verifyPickupSchema), OrderController.verifyPickupAndCollect);

// Shared single order inspection (customer or shop staff)
router.get('/:orderId', OrderController.getOrderById);

export default router;
