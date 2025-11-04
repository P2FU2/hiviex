/**
 * Prisma Client Singleton
 * 
 * Ensures we only create one instance of PrismaClient in development
 * to avoid multiple connections during hot reload.
 * 
 * Handles both Internal and External Database URLs for Render
 * Uses lazy initialization to avoid build-time errors
 */

import { PrismaClient } from '@prisma/client'
import { normalizeDatabaseUrl } from './connection'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaUrl: string | undefined
}

// Lazy initialization function
function getDatabaseUrl(): string {
  // Check if we already have a normalized URL cached
  if (globalForPrisma.prismaUrl) {
    return globalForPrisma.prismaUrl
  }

  let databaseUrl: string | undefined = process.env.DATABASE_URL

  if (!databaseUrl) {
    // During build, DATABASE_URL might not be available
    // Check if we're in build mode by checking Next.js build environment
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                        process.env.NEXT_PHASE === 'phase-development-build'
    
    if (isBuildTime) {
      // During build, use a valid placeholder URL format
      // This will be replaced at runtime when DATABASE_URL is available
      return 'postgresql://user:password@localhost:5432/database?sslmode=require'
    }
    
    // At runtime, warn but still use placeholder
    if (typeof window === 'undefined') {
      console.warn('⚠️  DATABASE_URL is not set in environment variables')
    }
    // Return a valid format URL that will fail at runtime with a clear error
    return 'postgresql://runtime-placeholder:runtime-placeholder@localhost:5432/runtime-placeholder?sslmode=require'
  }

  // Normalize the URL (add SSL params if needed)
  try {
    databaseUrl = normalizeDatabaseUrl(databaseUrl)
    // Cache the normalized URL
    globalForPrisma.prismaUrl = databaseUrl
    return databaseUrl
  } catch (error) {
    console.error('⚠️  Error normalizing DATABASE_URL:', error)
    // Return original URL if normalization fails
    globalForPrisma.prismaUrl = databaseUrl
    return databaseUrl
  }
}

// Create Prisma Client with lazy URL resolution
// This prevents build-time errors when DATABASE_URL is not available
function createPrismaClient(): PrismaClient {
  const url = getDatabaseUrl()
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url,
      },
    },
  })
}

// Lazy getter for Prisma Client
export const prisma: PrismaClient = (() => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const client = createPrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
})()

export default prisma
