/**
 * AI Influencer — detalhe e atualização.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { patchInfluencerBodySchema } from '@/lib/validators/influencer'

export const dynamic = 'force-dynamic'

async function loadInfluencerForUser(influencerId: string, userId: string) {
  const inf = await prisma.aIInfluencer.findUnique({
    where: { id: influencerId },
    include: {
      currentVersion: true,
      versions: { orderBy: { version: 'desc' }, take: 20 },
    },
  })
  if (!inf) return { error: 'NOT_FOUND' as const }
  const allowed = await hasTenantPermission(userId, inf.tenantId, 'MEMBER')
  if (!allowed) return { error: 'FORBIDDEN' as const }
  return { influencer: inf }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await Promise.resolve(params)
    const result = await loadInfluencerForUser(id, session.user.id)
    if (result.error === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (result.error === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(result.influencer)
  } catch (e) {
    console.error('GET /api/influencers/[id]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await Promise.resolve(params)
    const result = await loadInfluencerForUser(id, session.user.id)
    if (result.error === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (result.error === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const inf = result.influencer
    const body = await request.json()
    const parsed = patchInfluencerBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, slug, status, metadata } = parsed.data

    if (slug !== undefined && slug !== null) {
      const clash = await prisma.aIInfluencer.findFirst({
        where: {
          tenantId: inf.tenantId,
          slug,
          NOT: { id: inf.id },
        },
        select: { id: true },
      })
      if (clash) {
        return NextResponse.json(
          { error: 'Slug já em uso neste workspace' },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.aIInfluencer.update({
      where: { id: inf.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(metadata !== undefined ? { metadata: metadata as object } : {}),
      },
      include: {
        currentVersion: true,
        versions: { orderBy: { version: 'desc' }, take: 20 },
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /api/influencers/[id]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
