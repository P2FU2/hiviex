/**
 * PING Redis com cliente descartável (evita depender do singleton do worker no painel).
 */

import Redis from 'ioredis'
import { getBullMQConnection } from '@/lib/redis/bullmq-connection'

function redisClientOptions() {
  const c = getBullMQConnection() as {
    host: string
    port: number
    password?: string
    username?: string
    tls?: { rejectUnauthorized?: boolean }
  }
  const tlsOpts =
    c.tls && Object.keys(c.tls).length > 0
      ? { rejectUnauthorized: c.tls.rejectUnauthorized !== false }
      : undefined

  return {
    host: c.host,
    port: c.port,
    password: c.password,
    username: c.username,
    tls: tlsOpts,
    maxRetriesPerRequest: null,
    connectTimeout: 6000,
  }
}

export async function pingRedisDisposable(): Promise<boolean> {
  const client = new Redis(redisClientOptions())
  try {
    const p = await client.ping()
    return p === 'PONG'
  } catch {
    return false
  } finally {
    try {
      await client.quit()
    } catch {
      client.disconnect()
    }
  }
}
