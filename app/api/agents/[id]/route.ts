/**
 * Agent API Route
 * GET: Get agent details
 * PUT: Update agent
 * DELETE: Delete agent
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
  const resolvedParams = await Promise.resolve(params)
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    const agent = await prisma.agent.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: { in: tenantIds },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error('Error fetching agent:', error)
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
  const resolvedParams = await Promise.resolve(params)
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    const agent = await prisma.agent.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: { in: tenantIds },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, provider, model, temperature, maxTokens, status, metadata } = body

    const updatedAgent = await prisma.agent.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        description,
        provider,
        model,
        temperature,
        maxTokens,
        status,
        metadata: metadata || {},
      },
    })

    return NextResponse.json(updatedAgent)
  } catch (error) {
    console.error('Error updating agent:', error)
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
  const resolvedParams = await Promise.resolve(params)
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    const agent = await prisma.agent.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: { in: tenantIds },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    await prisma.agent.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
