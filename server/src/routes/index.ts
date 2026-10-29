import { Router, Request, Response } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import shopRoutes from '../modules/shops/shop.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import orderRoutes from '../modules/orders/order.routes.js';
import shopManagementRoutes from '../modules/shop-management/shop-management.routes.js';
import { apiSuccess } from '../utils/response.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  return apiSuccess(res, {
    status: 'healthy',
    platform: 'Village1',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Domain routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/shops', shopRoutes);
router.use('/admin', adminRoutes);
router.use('/orders', orderRoutes);
router.use('/shop-management', shopManagementRoutes);

export default router;
