/**
 * Workflows API Route
 * GET: List all workflows for user's workspaces
 * POST: Create a new workflow
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

    // Get all workflows
    const workflows = await prisma.workflow.findMany({
      where: {
        tenantId: { in: tenantIds },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        agents: {
          include: {
            agent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            agents: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Error fetching workflows:', error)
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
    const { name, description, tenantId, config } = body

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

    // Create workflow
    const workflow = await prisma.workflow.create({
      data: {
        name,
        description,
        tenantId: finalTenantId,
        status: 'PAUSED',
        config: config || {},
      },
      include: {
        agents: true,
      },
    })

    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

