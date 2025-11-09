/**
 * Agent Persona API Route
 * GET: Get agent persona
 * PUT: Update agent persona
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
    const agentId = resolvedParams.id

    // Get user's workspaces
    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    // Check if agent exists and user has access
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: { in: tenantIds },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Get or create persona
    let persona = await (prisma as any).agentPersona.findUnique({
      where: { agentId },
    })

    if (!persona) {
      // Create default persona
      persona = await (prisma as any).agentPersona.create({
        data: {
          agentId,
          objective: 'Assistir usuários de forma eficiente e amigável',
        },
      })
    }

    return NextResponse.json(persona)
  } catch (error) {
    console.error('Error fetching persona:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const agentId = resolvedParams.id
    const body = await request.json()

    // Get user's workspaces
    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    // Check if agent exists and user has access
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: { in: tenantIds },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Create persona
    const persona = await (prisma as any).agentPersona.create({
      data: {
        agentId,
        objective: body.objective || 'Assistir usuários de forma eficiente e amigável',
        motivation: body.motivation,
        voiceTone: body.voiceTone,
        style: body.style,
        values: body.values || null,
        archetype: body.archetype,
        emotions: body.emotions || null,
        tags: body.tags || [],
        behaviorParams: body.behaviorParams || null,
      },
    })

    return NextResponse.json(persona, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Persona already exists, update it
      return PUT(request, { params })
    }
    console.error('Error creating persona:', error)
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

    const agentId = resolvedParams.id
    const body = await request.json()

    // Get user's workspaces
    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    // Check if agent exists and user has access
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: { in: tenantIds },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Update or create persona
    const persona = await (prisma as any).agentPersona.upsert({
      where: { agentId },
      update: {
        objective: body.objective,
        motivation: body.motivation,
        voiceTone: body.voiceTone,
        style: body.style,
        values: body.values,
        archetype: body.archetype,
        emotions: body.emotions,
        tags: body.tags,
        behaviorParams: body.behaviorParams,
      },
      create: {
        agentId,
        objective: body.objective || 'Assistir usuários de forma eficiente e amigável',
        motivation: body.motivation,
        voiceTone: body.voiceTone,
        style: body.style,
        values: body.values || [],
        archetype: body.archetype,
        emotions: body.emotions || [],
        tags: body.tags || [],
        behaviorParams: body.behaviorParams || {},
      },
    })

    return NextResponse.json(persona)
  } catch (error) {
    console.error('Error updating persona:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

