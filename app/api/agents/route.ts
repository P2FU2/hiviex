/**
 * Agents API Routes
 * GET: List agents for a tenant
 * POST: Create new agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasTenantPermission } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { TenantRole } from '@prisma/client'
import { z } from 'zod'

const createAgentSchema = z.object({
  tenantId: z.string().cuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  personality: z.string().min(10),
  provider: z.enum(['openai', 'anthropic', 'cohere', 'custom']).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // Check permission
    const hasPermission = await hasTenantPermission(
      session.user.id,
      tenantId,
      TenantRole.MEMBER
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const agents = await prisma.agent.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createAgentSchema.parse(body)

    // Check permission (need at least MEMBER role)
    const hasPermission = await hasTenantPermission(
      session.user.id,
      data.tenantId,
      TenantRole.MEMBER
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const agent = await prisma.agent.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        personality: data.personality,
        provider: data.provider || 'openai',
        model: data.model || 'gpt-4',
        temperature: data.temperature ?? 0.7,
        maxTokens: data.maxTokens,
      },
    })

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error creating agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

