/**
 * Workspace API Keys API Route
 * GET: lista chaves (sem segredo)
 * POST: cria chave (segredo cifrado; nunca devolvido integralmente depois)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { encrypt } from '@/lib/utils/encryption'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createKeySchema = z.object({
  name: z.string().min(1).max(120),
  provider: z.string().min(1).max(64),
  key: z.string().min(8).max(8192),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const workspaceId = resolvedParams.id

    const tenantMemberships = await getUserTenants(session.user.id)
    const membership = tenantMemberships.find((tm: any) => tm.tenantId === workspaceId)

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can view API keys' },
        { status: 403 }
      )
    }

    const rows = await prisma.workspaceApiKey.findMany({
      where: { tenantId: workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        provider: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
      },
    })

    return NextResponse.json(rows)
  } catch (error: any) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

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
    const workspaceId = resolvedParams.id

    const tenantMemberships = await getUserTenants(session.user.id)
    const membership = tenantMemberships.find((tm: any) => tm.tenantId === workspaceId)

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can add API keys' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createKeySchema.parse(body)
    const provider = parsed.provider.toLowerCase().trim()
    const trimmed = parsed.key.trim()
    const keyPrefix =
      trimmed.length <= 12 ? `${trimmed.slice(0, 4)}…` : `${trimmed.slice(0, 8)}…`

    const row = await prisma.workspaceApiKey.create({
      data: {
        tenantId: workspaceId,
        name: parsed.name.trim(),
        provider,
        keyPrefix,
        encryptedSecret: encrypt(trimmed),
      },
      select: {
        id: true,
        name: true,
        provider: true,
        keyPrefix: true,
        createdAt: true,
      },
    })

    return NextResponse.json(row, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }
    console.error('Error adding API key:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
