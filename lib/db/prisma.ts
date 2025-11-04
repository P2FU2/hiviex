/**
 * Prisma Client Singleton
 * 
 * Ensures we only create one instance of PrismaClient in development
 * to avoid multiple connections during hot reload.
 * 
 * Handles both Internal and External Database URLs for Render
 */

import { PrismaClient } from '@prisma/client'
import { normalizeDatabaseUrl } from './connection'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validate and normalize DATABASE_URL
// Note: During build time, DATABASE_URL might not be available
// We'll validate it at runtime when actually used
let databaseUrl: string | undefined = process.env.DATABASE_URL

if (!databaseUrl) {
  // Only warn, don't throw during build
  // Will fail at runtime when actually used if not set
  if (typeof window === 'undefined') {
    // Server-side only
    console.warn('⚠️  DATABASE_URL is not set in environment variables')
  }
} else {
  // Normalize the URL (add SSL params if needed)
  try {
    databaseUrl = normalizeDatabaseUrl(databaseUrl)
  } catch (error) {
    console.error('⚠️  Error normalizing DATABASE_URL:', error)
    // Continue with original URL if normalization fails
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

