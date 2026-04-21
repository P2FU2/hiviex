/**
 * Opções ioredis alinhadas a getBullMQConnection (REDIS_URL ou HOST/PORT).
 */

import type { RedisOptions } from 'ioredis'
import { getBullMQConnection } from '@/lib/redis/bullmq-connection'

export function getIORedisOptions(): RedisOptions {
  const c = getBullMQConnection()
  const base: RedisOptions = {
    host: c.host,
    port: c.port,
    password: c.password,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  }
  if ('username' in c && (c as { username?: string }).username) {
    base.username = (c as { username: string }).username
  }
  if ('tls' in c && c.tls && Object.keys(c.tls).length > 0) {
    base.tls = c.tls
  }
  return base
}
