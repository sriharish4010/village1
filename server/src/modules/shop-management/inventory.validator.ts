import { z } from 'zod';

export const createProductSchema = z.object({
  params: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
  }),
  body: z.object({
    name: z.string().min(2, 'Item name must be at least 2 characters long'),
    category: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    price: z.number().positive('Price must be greater than zero'),
    mrp: z.number().positive('MRP must be greater than zero').optional().nullable(),
    stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative').default(0),
    unit: z.string().default('piece'),
    imageUrl: z.string().url('Invalid image URL format').optional().or(z.literal('')).nullable(),
    isAvailable: z.boolean().default(true),
    lowStockThreshold: z.number().int().min(0).default(5),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
    productId: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    name: z.string().min(2, 'Item name must be at least 2 characters long').optional(),
    category: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    price: z.number().positive('Price must be greater than zero').optional(),
    mrp: z.number().positive('MRP must be greater than zero').optional().nullable(),
    stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
    unit: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal('')).nullable(),
    isAvailable: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
  }),
});

export const adjustStockSchema = z.object({
  params: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
    productId: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    delta: z.number().int('Delta must be an integer (positive to add, negative to reduce)'),
    reason: z.string().min(2, 'A recorded reason is required for stock adjustments'),
  }),
});

export const createPosBillSchema = z.object({
  params: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
  }),
  body: z
    .object({
      customerName: z.string().optional().nullable(),
      customerPhone: z
        .string()
        .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
        .optional()
        .nullable()
        .or(z.literal('')),
      customerAddress: z.string().optional().nullable(),
      discount: z.number().min(0, 'Discount cannot be negative').default(0),
      paymentMethod: z.enum(['CASH', 'UPI']).default('CASH'),
      paymentReference: z.string().optional().nullable(),
      cashReceived: z.number().min(0).optional().nullable(),
      isDraft: z.boolean().optional().default(false),
      paymentConfirmed: z.boolean().optional().default(false),
      notes: z.string().optional().nullable(),
      items: z
        .array(
          z.object({
            productId: z.string().min(1, 'Product ID is required'),
            quantity: z.number().int().positive('Quantity must be at least 1'),
          })
        )
        .min(1, 'Bill must contain at least one item'),
    })
    .superRefine((data, ctx) => {
      // If finalizing the bill directly, enforce required customer fields
      if (!data.isDraft) {
        if (!data.customerName || data.customerName.trim().length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['customerName'],
            message: 'Customer name is required (minimum 2 characters)',
          });
        }
        if (!data.customerPhone || !/^[6-9]\d{9}$/.test(data.customerPhone.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['customerPhone'],
            message: 'A valid 10-digit Indian mobile number is required (starting with 6-9)',
          });
        }
        if (!data.customerAddress || data.customerAddress.trim().length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['customerAddress'],
            message: 'Place / area is required (minimum 2 characters)',
          });
        }
      }
    }),
});

export const updatePosDraftBillSchema = z.object({
  params: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
    billId: z.string().min(1, 'Bill ID is required'),
  }),
  body: z.object({
    customerName: z.string().optional().nullable(),
    customerPhone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
      .optional()
      .nullable()
      .or(z.literal('')),
    customerAddress: z.string().optional().nullable(),
    discount: z.number().min(0, 'Discount cannot be negative').default(0),
    paymentMethod: z.enum(['CASH', 'UPI']).default('CASH'),
    paymentReference: z.string().optional().nullable(),
    cashReceived: z.number().min(0).optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          quantity: z.number().int().positive('Quantity must be at least 1'),
        })
      )
      .min(1, 'Bill must contain at least one item'),
  }),
});

export const finalizePosDraftBillSchema = z.object({
  params: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
    billId: z.string().min(1, 'Bill ID is required'),
  }),
  body: z
    .object({
      customerName: z.string().optional().nullable(),
      customerPhone: z
        .string()
        .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
        .optional()
        .nullable()
        .or(z.literal('')),
      customerAddress: z.string().optional().nullable(),
      paymentMethod: z.enum(['CASH', 'UPI']).default('CASH'),
      paymentReference: z.string().optional().nullable(),
      paymentConfirmed: z.boolean().optional().default(false),
      cashReceived: z.number().min(0).optional().nullable(),
    }),
});

export const voidPosBillSchema = z.object({
  params: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
    billId: z.string().min(1, 'Bill ID is required'),
  }),
  body: z.object({
    reason: z.string().min(3, 'A recorded reason is required to void a bill'),
  }),
});

export const shopItemQuerySchema = z.object({
  params: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
  }),
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    availability: z.enum(['ALL', 'AVAILABLE', 'UNAVAILABLE']).optional().default('ALL'),
    lowStockOnly: z.enum(['true', 'false']).optional(),
    includeArchived: z.enum(['true', 'false']).optional().default('false'),
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('50'),
  }),
});

export const salesFilterQuerySchema = z.object({
  params: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
  }),
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional(),
    source: z.enum(['ALL', 'POS_WALKIN', 'ONLINE_ORDER']).optional().default('ALL'),
    paymentMethod: z.string().optional(),
    paymentStatus: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('50'),
  }),
});

export const inventoryHistoryQuerySchema = z.object({
  params: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
  }),
  query: z.object({
    productId: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('50'),
  }),
});
