/**
 * Histórico de mensagens do chat com o agente (para sincronizar UI com a BD).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await Promise.resolve(params)
    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm) => tm.tenantId)

    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: { in: tenantIds },
      },
      select: { id: true, tenantId: true },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const limitParam = request.nextUrl.searchParams.get('limit')
    const limit = Math.min(Math.max(parseInt(limitParam || '80', 10) || 80, 1), 200)

    const rows = await prisma.message.findMany({
      where: {
        agentId,
        tenantId: agent.tenantId,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      messages: rows.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/agents/[id]/messages', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
