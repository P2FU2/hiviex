/**
 * Cliente ioredis partilhado (lock do scheduler, heartbeat do worker, health).
 */

import Redis from 'ioredis'
import { getBullMQConnection } from '@/lib/redis/bullmq-connection'

let shared: Redis | null = null

export function getWorkerRedis(): Redis {
  if (shared) return shared
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

  shared = new Redis({
    host: c.host,
    port: c.port,
    password: c.password,
    username: c.username,
    tls: tlsOpts,
    maxRetriesPerRequest: null,
  })
  return shared
}
