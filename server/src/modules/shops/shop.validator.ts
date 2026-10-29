import { z } from 'zod';

export const createShopSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Shop name must be at least 2 characters long'),
    categoryId: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
    address: z.string().min(3, 'Address is required'),
    village: z.string().min(2, 'Village is required'),
    district: z.string().min(2, 'District is required'),
    state: z.string().default('Tamil Nadu'),
    pinCode: z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
    email: z.string().email('Invalid email address format').optional().or(z.literal('')),
    openingHours: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Opening hours must be HH:MM format (e.g. 08:00)').default('08:00'),
    closingHours: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Closing hours must be HH:MM format (e.g. 21:00)').default('21:00'),
    weeklyHoliday: z.string().optional().default('None'),
    pickupInstructions: z.string().optional(),
    policies: z.string().optional(),
  }),
});

export const updateShopSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    address: z.string().min(3).optional(),
    village: z.string().min(2).optional(),
    district: z.string().min(2).optional(),
    pinCode: z.string().regex(/^\d{6}$/).optional(),
    phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
    email: z.string().email().optional().or(z.literal('')),
    openingHours: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    closingHours: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    weeklyHoliday: z.string().optional(),
    pickupInstructions: z.string().optional(),
    policies: z.string().optional(),
  }),
});

export const shopQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    village: z.string().optional(),
    categoryId: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    sort: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc']).optional().default('name_asc'),
  }),
  params: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
  }),
});

export type CreateShopInput = z.infer<typeof createShopSchema>['body'];
export type UpdateShopInput = z.infer<typeof updateShopSchema>['body'];
export type ProductQueryInput = z.infer<typeof productQuerySchema>['query'];
