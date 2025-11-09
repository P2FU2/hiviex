/**
 * Flow API Route (Single Flow)
 * GET: Get flow by ID
 * PUT: Update flow
 * DELETE: Delete flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const flowId = resolvedParams.id

    // Get user's workspaces
    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    // Get flow
    const flow = await (prisma as any).flow.findFirst({
      where: {
        id: flowId,
        tenantId: { in: tenantIds },
      },
      include: {
        nodes: {
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        connections: true,
      },
    })

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    return NextResponse.json(flow)
  } catch (error) {
    console.error('Error fetching flow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const flowId = resolvedParams.id
    const body = await request.json()
    const { name, description, status, triggerType, triggerConfig, nodes, connections } = body

    // Get user's workspaces
    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    // Check if flow exists and user has access
    const existingFlow = await (prisma as any).flow.findFirst({
      where: {
        id: flowId,
        tenantId: { in: tenantIds },
      },
    })

    if (!existingFlow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    // Update flow
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (triggerType !== undefined) updateData.triggerType = triggerType
    if (triggerConfig !== undefined) updateData.triggerConfig = triggerConfig

    // Update nodes and connections if provided
    if (nodes !== undefined || connections !== undefined) {
      // Delete existing nodes and connections
      await (prisma as any).flowConnection.deleteMany({
        where: { flowId },
      })
      await (prisma as any).flowNode.deleteMany({
        where: { flowId },
      })

      // Create new nodes and connections
      if (nodes) {
        await (prisma as any).flowNode.createMany({
          data: nodes.map((node: any) => ({
            flowId,
            type: node.type,
            agentId: node.agentId,
            processType: node.processType,
            positionX: node.positionX,
            positionY: node.positionY,
            label: node.label,
            config: node.config || {},
          })),
        })
      }

      if (connections) {
        // Get node IDs after creation
        const createdNodes = await (prisma as any).flowNode.findMany({
          where: { flowId },
        })
        const nodeMap = new Map(
          createdNodes.map((node: any) => [node.id, node])
        )

        // Map old node IDs to new ones (simplified - in production, use proper mapping)
        await (prisma as any).flowConnection.createMany({
          data: connections
            .filter((conn: any) => {
              const sourceExists = createdNodes.some(
                (n: any) => n.id === conn.sourceNodeId
              )
              const targetExists = createdNodes.some(
                (n: any) => n.id === conn.targetNodeId
              )
              return sourceExists && targetExists
            })
            .map((conn: any) => ({
              flowId,
              sourceNodeId: conn.sourceNodeId,
              targetNodeId: conn.targetNodeId,
              condition: conn.condition,
              config: conn.config || {},
            })),
        })
      }
    }

    const updatedFlow = await (prisma as any).flow.update({
      where: { id: flowId },
      data: updateData,
      include: {
        nodes: true,
        connections: true,
      },
    })

    return NextResponse.json(updatedFlow)
  } catch (error) {
    console.error('Error updating flow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const flowId = resolvedParams.id

    // Get user's workspaces
    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    // Check if flow exists and user has access
    const existingFlow = await (prisma as any).flow.findFirst({
      where: {
        id: flowId,
        tenantId: { in: tenantIds },
      },
    })

    if (!existingFlow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    // Delete flow (cascade will handle nodes and connections)
    await (prisma as any).flow.delete({
      where: { id: flowId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting flow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

