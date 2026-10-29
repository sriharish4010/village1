import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or repository root directory
const serverEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
}
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
dotenv.config();


export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  
  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'village1_access_secret_super_secure_key_2026_dev_only',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'village1_refresh_secret_super_secure_key_2026_dev_only',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY_DAYS: parseInt(process.env.JWT_REFRESH_EXPIRY_DAYS || '7', 10),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),

  // Development Seeds
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || 'admin@village1.in',
  SEED_ADMIN_PHONE: process.env.SEED_ADMIN_PHONE || '9999900001',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || 'AdminSecure@123',

  SEED_SHOPKEEPER_EMAIL: process.env.SEED_SHOPKEEPER_EMAIL || 'shopkeeper@village1.in',
  SEED_SHOPKEEPER_PHONE: process.env.SEED_SHOPKEEPER_PHONE || '9876543210',
  SEED_SHOPKEEPER_PASSWORD: process.env.SEED_SHOPKEEPER_PASSWORD || 'Shopkeeper@123',

  SEED_CUSTOMER_EMAIL: process.env.SEED_CUSTOMER_EMAIL || 'customer@village1.in',
  SEED_CUSTOMER_PHONE: process.env.SEED_CUSTOMER_PHONE || '9123456780',
  SEED_CUSTOMER_PASSWORD: process.env.SEED_CUSTOMER_PASSWORD || 'Customer@123',
};
