/**
 * AI Influencers — listar e criar (v1 + primeira versão).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { createInfluencerBodySchema } from '@/lib/validators/influencer'

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

    const ok = await hasTenantPermission(session.user.id, tenantId, 'MEMBER')
    if (!ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rows = await prisma.aIInfluencer.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      include: {
        currentVersion: {
          select: {
            id: true,
            version: true,
            status: true,
            updatedAt: true,
          },
        },
        _count: { select: { versions: true } },
      },
    })

    return NextResponse.json({ influencers: rows })
  } catch (e) {
    console.error('GET /api/influencers', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = createInfluencerBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { tenantId, name, slug, initialIdentityPack } = parsed.data

    const canEdit = await hasTenantPermission(session.user.id, tenantId, 'MEMBER')
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (slug) {
      const clash = await prisma.aIInfluencer.findFirst({
        where: { tenantId, slug },
        select: { id: true },
      })
      if (clash) {
        return NextResponse.json(
          { error: 'Slug já em uso neste workspace' },
          { status: 409 }
        )
      }
    }

    const influencer = await prisma.aIInfluencer.create({
      data: {
        tenantId,
        createdByUserId: session.user.id,
        name,
        slug: slug ?? null,
        status: 'DRAFT',
      },
    })

    const v = await prisma.aIInfluencerVersion.create({
      data: {
        influencerId: influencer.id,
        version: 1,
        status: 'DRAFT',
        identityPack: (initialIdentityPack ?? {
          summary: 'Preencher identidade visual e voz nas próximas iterações.',
        }) as object,
      },
    })

    await prisma.aIInfluencer.update({
      where: { id: influencer.id },
      data: { currentVersionId: v.id },
    })

    const full = await prisma.aIInfluencer.findUnique({
      where: { id: influencer.id },
      include: {
        currentVersion: true,
        versions: { orderBy: { version: 'desc' }, take: 5 },
      },
    })

    return NextResponse.json(full, { status: 201 })
  } catch (e) {
    console.error('POST /api/influencers', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
