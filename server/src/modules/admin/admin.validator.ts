import { z } from 'zod';

export const rejectShopSchema = z.object({
  body: z.object({
    reason: z.string().min(3, 'A clear reason for rejection is required (minimum 3 characters)'),
  }),
});

export const suspendShopSchema = z.object({
  body: z.object({
    reason: z.string().min(3, 'A clear reason for suspension is required (minimum 3 characters)'),
  }),
});

export const userStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive boolean flag is required' }),
    reason: z.string().min(3, 'A justification reason is required for status changes'),
  }),
});

export const adminShopQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    status: z.enum(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional().default('ALL'),
    search: z.string().optional(),
    village: z.string().optional(),
    categoryId: z.string().optional(),
  }),
});

export const adminUserQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    role: z.enum(['ALL', 'CUSTOMER', 'SHOPKEEPER', 'ADMIN']).optional().default('ALL'),
    status: z.enum(['ALL', 'ACTIVE', 'INACTIVE']).optional().default('ALL'),
    search: z.string().optional(),
  }),
});

export type RejectShopInput = z.infer<typeof rejectShopSchema>['body'];
export type SuspendShopInput = z.infer<typeof suspendShopSchema>['body'];
export type UserStatusInput = z.infer<typeof userStatusSchema>['body'];
