/**
 * Contas sociais ligadas ao tenant (para agendar publicações).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId')
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 })
    }

    const memberships = await getUserTenants(session.user.id)
    const allowed = memberships.some((m: { tenantId: string }) => m.tenantId === tenantId)
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const accounts = await prisma.socialAccount.findMany({
      where: { tenantId, status: 'CONNECTED' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        platform: true,
        platformUsername: true,
        platformPageId: true,
        status: true,
      },
    })

    return NextResponse.json({ accounts })
  } catch (e) {
    console.error('social-accounts GET', e)
    return NextResponse.json({ error: 'Falha ao listar contas' }, { status: 500 })
  }
}
