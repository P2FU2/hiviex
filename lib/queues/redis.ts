/**
 * Redis Connection for BullMQ
 * Configured for Upstash Redis (TLS support)
 */

import Redis from 'ioredis'

let redis: Redis | null = null

/**
 * Get or create Redis connection
 * Upstash Redis requires TLS and uses a specific URL format
 */
export function getRedisConnection(): Redis {
  if (redis) {
    return redis
  }

  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set')
  }

  // Parse Redis URL
  // Upstash format: rediss://default:password@endpoint.upstash.io:6380
  // Standard format: redis://host:port or redis://password@host:port
  const url = new URL(redisUrl)
  const isTLS = url.protocol === 'rediss:'
  
  redis = new Redis({
    host: url.hostname,
    port: parseInt(url.port) || (isTLS ? 6380 : 6379),
    password: url.password || undefined,
    username: url.username || (url.password ? 'default' : undefined),
    tls: isTLS ? {
      rejectUnauthorized: false,
    } : undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
  })

  redis.on('error', (err) => {
    console.error('Redis connection error:', err)
  })

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully')
  })

  return redis
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const connection = getRedisConnection()
    await connection.ping()
    return true
  } catch (error) {
    console.error('Redis connection test failed:', error)
    return false
  }
}

