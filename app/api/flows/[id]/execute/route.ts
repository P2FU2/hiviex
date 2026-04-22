/**
 * Flow Execution API Route
 * POST: Execute a flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { startFlowExecution } from '@/lib/flows/start-flow-execution'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const flowId = resolvedParams.id
    const body = await request.json()
    const input = body.input || {}

    // Get user's workspaces
    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    // Get flow with nodes and connections
    const flow = await prisma.flow.findFirst({
      where: {
        id: flowId,
        tenantId: { in: tenantIds },
      },
      include: {
        nodes: {
          include: {
            agent: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        connections: true,
      },
    })

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    const started = await startFlowExecution(flow, input, { allowDraft: true })
    if (!started.ok) {
      return NextResponse.json(started.body, { status: started.status })
    }
    return NextResponse.json(started.execution)
  } catch (error) {
    console.error('Error executing flow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

