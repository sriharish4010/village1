import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { apiError } from '../utils/response.js';

// Standard rate limiter for general API requests (skips auth endpoints so auth has its own dedicated protection)
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'development' ? 5000 : env.RATE_LIMIT_MAX_REQUESTS,
  skip: (req) => {
    if (env.NODE_ENV === 'test') return true;
    // Let authLimiter handle authentication routes independently
    return req.baseUrl.includes('/auth') || req.path.includes('/auth');
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return apiError(
      res,
      'Too many requests from this IP, please try again later.',
      429,
      'TOO_MANY_REQUESTS'
    );
  },
});

// Stricter rate limiter for sensitive authentication endpoints (login, register, refresh)
// - Prevents brute-force credential stuffing without blocking legitimate successful logins
// - skipSuccessfulRequests: true ensures successful authentications do not consume the failure quota
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: env.NODE_ENV === 'development' ? 1000 : env.AUTH_RATE_LIMIT_MAX,
  skip: () => env.NODE_ENV === 'test',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return apiError(
      res,
      'Too many login or registration attempts. Please wait 15 minutes before trying again.',
      429,
      'AUTH_RATE_LIMIT_EXCEEDED'
    );
  },
});

