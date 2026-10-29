import { Request, Response, NextFunction } from 'express';
import { apiError } from '../utils/response.js';
import { env } from '../config/env.js';

export function notFoundHandler(req: Request, res: Response) {
  return apiError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
}

export function globalErrorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) {
    return _next(err);
  }

  console.error('[Error]', {
    method: req.method,
    url: req.originalUrl,
    error: err.message || err,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const fields = err.meta?.target || 'field';
    return apiError(res, `A record with this ${fields} already exists`, 409, 'CONFLICT', { fields });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return apiError(res, 'The requested resource was not found', 404, 'NOT_FOUND');
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error occurred. Please try again later.'
    : err.message || 'An unexpected error occurred';

  return apiError(
    res,
    message,
    statusCode,
    err.code || 'INTERNAL_SERVER_ERROR',
    env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  );
}
