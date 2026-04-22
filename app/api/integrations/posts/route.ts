/**
 * Lista posts agendados do tenant (calendário editorial).
 * GET ?tenantId=&from=&to= (ISO 8601; default: mês atual UTC)
 */

import { NextRequest, NextResponse } from 'next/server'
import { endOfMonth, startOfMonth } from 'date-fns'
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

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId é obrigatório' },
        { status: 400 }
      )
    }

    const memberships = await getUserTenants(session.user.id)
    const allowed = memberships.some(
      (m: { tenantId: string }) => m.tenantId === tenantId
    )
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    let fromDate = searchParams.get('from')
      ? new Date(searchParams.get('from')!)
      : startOfMonth(now)
    let toDate = searchParams.get('to')
      ? new Date(searchParams.get('to')!)
      : endOfMonth(now)

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: 'Datas from/to inválidas' },
        { status: 400 }
      )
    }

    if (fromDate > toDate) {
      const t = fromDate
      fromDate = toDate
      toDate = t
    }

    const posts = await prisma.scheduledPost.findMany({
      where: {
        tenantId,
        scheduledAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        socialAccount: {
          select: {
            platform: true,
            platformUsername: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    })

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        platform: p.platform,
        contentType: p.contentType,
        title: p.title,
        caption: p.caption,
        hashtags: p.hashtags,
        scheduledAt: p.scheduledAt.toISOString(),
        publishedAt: p.publishedAt?.toISOString() ?? null,
        status: p.status,
        platformPostUrl: p.platformPostUrl,
        errorMessage: p.errorMessage,
        account: p.socialAccount
          ? {
              platform: p.socialAccount.platform,
              username: p.socialAccount.platformUsername,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error('List scheduled posts error:', error)
    return NextResponse.json(
      { error: 'Failed to list posts' },
      { status: 500 }
    )
  }
}
