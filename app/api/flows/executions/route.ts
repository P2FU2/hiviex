/**
 * Lista execuções de fluxos do tenant (calendário / dashboard).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

function mapUiStatus(
  s: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
): 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' {
  switch (s) {
    case 'PENDING':
      return 'queued'
    case 'RUNNING':
      return 'running'
    case 'COMPLETED':
      return 'completed'
    case 'FAILED':
      return 'failed'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'queued'
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId')?.trim()
    const from = request.nextUrl.searchParams.get('from')
    const to = request.nextUrl.searchParams.get('to')

    if (!tenantId || !from || !to) {
      return NextResponse.json(
        { error: 'tenantId, from, and to (ISO) are required' },
        { status: 400 }
      )
    }

    const memberships = await getUserTenants(session.user.id)
    if (!memberships.some((m: { tenantId: string }) => m.tenantId === tenantId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const fromDate = new Date(from)
    const toDate = new Date(to)

    const rows = await prisma.flowExecution.findMany({
      where: {
        flow: { tenantId },
        startedAt: { gte: fromDate, lte: toDate },
      },
      include: {
        flow: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 300,
    })

    const executions = rows.map((r) => ({
      id: r.id,
      flowId: r.flowId,
      flowName: r.flow.name,
      status: r.status,
      executionStatus: mapUiStatus(r.status),
      error: r.error,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    }))

    return NextResponse.json({ executions })
  } catch (e) {
    console.error('flows executions GET', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
