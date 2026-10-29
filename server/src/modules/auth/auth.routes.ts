import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  updateProfileSchema,
} from './auth.validator.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// Public routes with rate limiting & validation
router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', authLimiter, validate(refreshTokenSchema), AuthController.refreshToken);

// Protected routes (require valid Bearer access token)
router.post('/logout', authenticateToken, validate(logoutSchema), AuthController.logout);
router.get('/me', authenticateToken, AuthController.getMe);
router.put('/profile', authenticateToken, validate(updateProfileSchema), AuthController.updateProfile);

export default router;
