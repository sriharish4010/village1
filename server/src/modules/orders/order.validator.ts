import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
    paymentMethod: z.enum(['CASH_ON_PICKUP', 'UPI_QR']),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity cannot exceed 100'),
        })
      )
      .min(1, 'At least one item is required to place an order'),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'REJECTED']),
    rejectionReason: z.string().min(3, 'Rejection reason must be at least 3 characters').optional(),
  }),
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
});

export const verifyPickupSchema = z.object({
  body: z.object({
    pickupCode: z.string().min(4, 'Pickup verification code is required').max(10),
  }),
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
});

export const packOrderItemSchema = z.object({
  body: z.object({
    isPacked: z.boolean(),
  }),
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    itemId: z.string().min(1, 'Item ID is required'),
  }),
});

export const orderQuerySchema = z.object({
  query: z.object({
    status: z.string().optional(),
    shopId: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];
export type VerifyPickupInput = z.infer<typeof verifyPickupSchema>['body'];
export type PackOrderItemInput = z.infer<typeof packOrderItemSchema>['body'];
