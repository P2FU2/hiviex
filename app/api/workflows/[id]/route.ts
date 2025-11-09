/**
 * Workflow API Route
 * GET: Get workflow details
 * PUT: Update workflow
 * DELETE: Delete workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        tenantId: { in: tenantIds },
      },
      include: {
        agents: {
          include: {
            agent: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        tenantId: { in: tenantIds },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, status, config } = body

    const updatedWorkflow = await prisma.workflow.update({
      where: { id: params.id },
      data: {
        name,
        description,
        status,
        config: config || {},
      },
    })

    return NextResponse.json(updatedWorkflow)
  } catch (error) {
    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: params.id,
        tenantId: { in: tenantIds },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    await prisma.workflow.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

