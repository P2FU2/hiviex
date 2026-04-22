/**
 * Health agregado: DB, Redis, heartbeat do worker (opcional).
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getWorkerRedis } from '@/lib/redis/worker-redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  let db: 'ok' | 'error' = 'error'
  let redis: 'ok' | 'error' = 'error'
  let workers: 'ok' | 'degraded' | 'error' = 'error'

  try {
    await prisma.$queryRaw`SELECT 1`
    db = 'ok'
  } catch {
    db = 'error'
  }

  try {
    const r = getWorkerRedis()
    const p = await r.ping()
    redis = p === 'PONG' ? 'ok' : 'error'
  } catch {
    redis = 'error'
  }

  if (redis === 'ok') {
    try {
      const r = getWorkerRedis()
      const ts = await r.get('hiviex:health:worker')
      if (ts && Date.now() - Number(ts) < 120_000) {
        workers = 'ok'
      } else {
        workers = 'degraded'
      }
    } catch {
      workers = 'error'
    }
  }

  const healthy = db === 'ok' && redis === 'ok'
  return NextResponse.json(
    { db, redis, workers },
    { status: healthy ? 200 : 503 }
  )
}
