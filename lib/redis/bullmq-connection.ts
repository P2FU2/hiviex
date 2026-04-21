/**
 * Single BullMQ/ioredis-style connection config for Queue + Worker.
 * Supports REDIS_URL (e.g. Upstash rediss://) or REDIS_HOST / REDIS_PORT / REDIS_PASSWORD.
 */

export type BullMQConnection =
  | {
      host: string
      port: number
      password?: string
      username?: string
      tls?: { rejectUnauthorized?: boolean }
    }
  | {
      host: string
      port: number
      password?: string
      username?: string
      tls: Record<string, never>
    }

export function getBullMQConnection(): BullMQConnection {
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    const url = new URL(redisUrl)
    const isTLS = url.protocol === 'rediss:'
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || (isTLS ? 6380 : 6379),
      password: url.password || undefined,
      username: url.username && url.username !== 'default' ? url.username : undefined,
      ...(isTLS
        ? {
            tls: {
              // Upstash and some managed Redis use certs that chain correctly; prefer true in prod.
              rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
            },
          }
        : {}),
    }
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  }
}
