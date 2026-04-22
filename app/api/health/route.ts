/**
 * Health agregado: DB, Redis, heartbeat do worker (opcional).
 */

import { NextResponse } from 'next/server'
import { runHealthChecks } from '@/lib/observability/run-health-checks'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { db, redis, workers } = await runHealthChecks()
  const healthy = db === 'ok' && redis === 'ok'
  return NextResponse.json(
    { db, redis, workers },
    { status: healthy ? 200 : 503 }
  )
}
