/**
 * Prisma Client Singleton
 * 
 * Ensures we only create one instance of PrismaClient in development
 * to avoid multiple connections during hot reload.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validate DATABASE_URL before creating PrismaClient
if (!process.env.DATABASE_URL) {
  console.error('⚠️  DATABASE_URL is not set in environment variables')
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required in production')
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

