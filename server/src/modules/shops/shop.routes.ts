import { Router } from 'express';
import { ShopController } from './shop.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createShopSchema, shopQuerySchema, productQuerySchema } from './shop.validator.js';

const router = Router();

// Public routes: Browsing shops and categories (no account required!)
router.get('/public', validate(shopQuerySchema), ShopController.getPublicShops);
router.get('/categories', ShopController.getCategories);

// Public route: Browse all active products for a shop with search and sort
router.get('/:shopId/products', validate(productQuerySchema), ShopController.getShopProducts);

// Protected routes (Shopkeeper / Customer onboarding)
router.post('/', authenticateToken, validate(createShopSchema), ShopController.registerShop);
router.get('/my-shops', authenticateToken, ShopController.getMyShops);

// Get single shop (public if approved, or restricted to owner/admin if not approved)
router.get('/:id', async (req, res, next) => {
  // Optional auth header inspection so members/admins can preview their unapproved shops
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req as any, res, () => ShopController.getShopById(req as any, res, next));
  }
  return ShopController.getShopById(req as any, res, next);
});

export default router;
