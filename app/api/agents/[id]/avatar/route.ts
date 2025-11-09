/**
 * Agent Avatar API Route
 * GET: Get agent avatar
 * PUT: Update agent avatar
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

    // Get or create avatar
    let avatar = await (prisma as any).agentAvatar.findUnique({
      where: { agentId },
    })

    if (!avatar) {
      // Create default avatar
      avatar = await (prisma as any).agentAvatar.create({
        data: {
          agentId,
        },
      })
    }

    return NextResponse.json(avatar)
  } catch (error) {
    console.error('Error fetching avatar:', error)
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

    // Create avatar
    const avatar = await (prisma as any).agentAvatar.create({
      data: {
        agentId,
        faceConfig: body.faceConfig || null,
        hairConfig: body.hairConfig || null,
        bodyConfig: body.bodyConfig || null,
        style: body.style,
        clothing: body.clothing || null,
        environment: body.environment || null,
        lighting: body.lighting || null,
        recordingStyle: body.recordingStyle || null,
        voiceTimbre: body.voiceTimbre,
        voiceAccent: body.voiceAccent,
        voiceRhythm: body.voiceRhythm,
      },
    })

    return NextResponse.json(avatar, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Avatar already exists, update it
      return PUT(request, { params })
    }
    console.error('Error creating avatar:', error)
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

    // Update or create avatar
    const avatar = await (prisma as any).agentAvatar.upsert({
      where: { agentId },
      update: {
        faceConfig: body.faceConfig,
        hairConfig: body.hairConfig,
        bodyConfig: body.bodyConfig,
        style: body.style,
        clothing: body.clothing,
        environment: body.environment,
        lighting: body.lighting,
        recordingStyle: body.recordingStyle,
        voiceTimbre: body.voiceTimbre,
        voiceAccent: body.voiceAccent,
        voiceRhythm: body.voiceRhythm,
      },
      create: {
        agentId,
        faceConfig: body.faceConfig || {},
        hairConfig: body.hairConfig || {},
        bodyConfig: body.bodyConfig || {},
        style: body.style,
        clothing: body.clothing || {},
        environment: body.environment || {},
        lighting: body.lighting || {},
        recordingStyle: body.recordingStyle || {},
        voiceTimbre: body.voiceTimbre,
        voiceAccent: body.voiceAccent,
        voiceRhythm: body.voiceRhythm,
      },
    })

    return NextResponse.json(avatar)
  } catch (error) {
    console.error('Error updating avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

