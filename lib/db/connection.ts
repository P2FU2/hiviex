/**
 * Database Connection Helper
 * 
 * Handles both Internal and External Database URLs
 * Automatically detects and uses the correct URL format
 */

/**
 * Normalize DATABASE_URL for Render
 * 
 * Render's Internal Database URL format: postgresql://user:pass@dpg-xxx-a:5432/db
 * Render's External Database URL format: postgresql://user:pass@dpg-xxx.region-postgres.render.com:5432/db
 * 
 * In production (Render), we should use Internal URL if available
 * But if Internal URL doesn't work, fallback to External URL
 */
export function normalizeDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }

  // If URL already has sslmode, return as is
  if (url.includes('sslmode=')) {
    return url
  }

  // Check if it's an Internal URL (format: dpg-xxx-a or dpg-xxx-a.region-postgres.render.com)
  const isInternal = url.includes('dpg-') && url.includes('-a:')
  
  // Check if it's an External URL (format: dpg-xxx.region-postgres.render.com)
  const isExternal = url.includes('.render.com')

  // For Internal URLs, sometimes they work without SSL
  // But it's safer to add SSL if it's an External URL or if we're in production
  if (isExternal || process.env.NODE_ENV === 'production') {
    // Add sslmode=require if not present
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}sslmode=require`
  }

  // For Internal URLs in Render, try without SSL first
  // But add connection timeout settings
  if (isInternal) {
    const separator = url.includes('?') ? '&' : '?'
    // Add connection pooling parameters
    return `${url}${separator}connect_timeout=10&pool_timeout=10`
  }

  // Default: return as is
  return url
}

/**
 * Get database connection info (without password)
 */
export function getDatabaseInfo(): {
  url: string
  host: string | null
  database: string | null
  isInternal: boolean
  isExternal: boolean
} {
  const url = process.env.DATABASE_URL
  
  if (!url) {
    return {
      url: 'not configured',
      host: null,
      database: null,
      isInternal: false,
      isExternal: false,
    }
  }

  try {
    const urlObj = new URL(url)
    const isInternal = url.includes('dpg-') && url.includes('-a:')
    const isExternal = url.includes('.render.com')

    return {
      url: url.replace(/:[^:@]+@/, ':****@'), // Mask password
      host: urlObj.hostname,
      database: urlObj.pathname.slice(1),
      isInternal,
      isExternal,
    }
  } catch {
    return {
      url: 'invalid',
      host: null,
      database: null,
      isInternal: false,
      isExternal: false,
    }
  }
}

