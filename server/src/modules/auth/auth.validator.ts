import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format').optional().or(z.literal('')),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    role: z.enum(['CUSTOMER', 'SHOPKEEPER'], {
      errorMap: () => ({ message: 'Public registration only permits CUSTOMER or SHOPKEEPER role' }),
    }).default('CUSTOMER'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    village: z.string().min(2, 'Village name is required'),
    district: z.string().min(2, 'District name is required'),
    state: z.string().default('Tamil Nadu'),
    pinCode: z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
    preferredLanguage: z.enum(['en', 'ta']).default('en'),
  }).refine((data) => data.email || data.phone, {
    message: 'Either email or phone number is required to register',
    path: ['phone'],
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(3, 'Email or phone number is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    village: z.string().min(2).optional(),
    district: z.string().min(2).optional(),
    state: z.string().optional(),
    pinCode: z.string().regex(/^\d{6}$/).optional(),
    preferredLanguage: z.enum(['en', 'ta']).optional(),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
