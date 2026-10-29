import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  rejectShopSchema,
  suspendShopSchema,
  userStatusSchema,
  adminShopQuerySchema,
  adminUserQuerySchema,
} from './admin.validator.js';

const router = Router();

// Strictly enforce server-side authentication and ADMIN role on every single admin API!
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

// Platform Overview Statistics
router.get('/stats', AdminController.getPlatformStats);

// Shop Approval Queue & Management
router.get('/shops', validate(adminShopQuerySchema), AdminController.getShops);
router.get('/shops/:id', AdminController.getShopDetails);
router.put('/shops/:id/approve', AdminController.approveShop);
router.put('/shops/:id/reject', validate(rejectShopSchema), AdminController.rejectShop);
router.put('/shops/:id/suspend', validate(suspendShopSchema), AdminController.suspendShop);
router.put('/shops/:id/reactivate', AdminController.reactivateShop);

// User Governance & Access Control
router.get('/users', validate(adminUserQuerySchema), AdminController.getUsers);
router.put('/users/:id/status', validate(userStatusSchema), AdminController.updateUserStatus);

// Platform Audit Logs
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
