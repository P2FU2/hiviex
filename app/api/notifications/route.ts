/**
 * Caixa de notificações por tenant (fluxos, publicação).
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

    const tenantId = request.nextUrl.searchParams.get('tenantId')?.trim()
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const memberships = await getUserTenants(session.user.id)
    if (!memberships.some((m: { tenantId: string }) => m.tenantId === tenantId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const items = await prisma.notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ notifications: items })
  } catch (e) {
    console.error('notifications GET', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const id = body.id as string | undefined
    const tenantId = body.tenantId as string | undefined
    const read = body.read as boolean | undefined

    if (!id || !tenantId || typeof read !== 'boolean') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const memberships = await getUserTenants(session.user.id)
    if (!memberships.some((m: { tenantId: string }) => m.tenantId === tenantId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.notification.updateMany({
      where: { id, tenantId },
      data: { read },
    })

    return NextResponse.json({ ok: updated.count > 0 })
  } catch (e) {
    console.error('notifications PATCH', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
