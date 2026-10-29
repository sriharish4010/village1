import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

export const prisma = global.__prismaClient || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.__prismaClient = prisma;
}

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('[Database] Connected successfully to database');
  } catch (error) {
    console.error('[Database] Failed to connect to database:', error);
    throw error;
  }
}
