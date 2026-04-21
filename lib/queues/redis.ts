/**
 * Cliente Redis standalone (health checks, cache) — mesma config que BullMQ.
 */

import Redis from 'ioredis'
import { getIORedisOptions } from '@/lib/redis/ioredis-options'

let redis: Redis | null = null

export function getRedisConnection(): Redis {
  if (redis) {
    return redis
  }

  redis = new Redis(getIORedisOptions())

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

