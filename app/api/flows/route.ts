/**
 * Flows API Route
 * GET: List all flows for user's workspaces
 * POST: Create a new flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspaces
    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    // Get all flows
    const flows = await (prisma as any).flow.findMany({
      where: {
        tenantId: { in: tenantIds },
      },
      include: {
        nodes: {
          include: {
            agent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        connections: true,
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(flows)
  } catch (error) {
    console.error('Error fetching flows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, tenantId, nodes, connections } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Get user's workspaces
    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    // Use first tenant if tenantId not provided
    const finalTenantId = tenantId || (tenantIds.length > 0 ? tenantIds[0] : null)

    if (!finalTenantId || !tenantIds.includes(finalTenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant or access denied' },
        { status: 403 }
      )
    }

    // Create flow with nodes and connections
    const flow = await (prisma as any).flow.create({
      data: {
        name,
        description,
        tenantId: finalTenantId,
        status: 'DRAFT',
        triggerType: 'MANUAL',
        nodes: nodes
          ? {
              create: nodes.map((node: any) => ({
                type: node.type,
                agentId: node.agentId,
                processType: node.processType,
                positionX: node.positionX,
                positionY: node.positionY,
                label: node.label,
                config: node.config || {},
              })),
            }
          : undefined,
        connections: connections
          ? {
              create: connections.map((conn: any) => ({
                sourceNodeId: conn.sourceNodeId,
                targetNodeId: conn.targetNodeId,
                condition: conn.condition,
                config: conn.config || {},
              })),
            }
          : undefined,
      },
      include: {
        nodes: true,
        connections: true,
      },
    })

    return NextResponse.json(flow)
  } catch (error) {
    console.error('Error creating flow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

