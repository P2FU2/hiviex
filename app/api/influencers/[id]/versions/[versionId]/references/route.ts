/**
 * Referências MediaAsset ligadas à versão.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { influencerReferenceBodySchema } from '@/lib/validators/influencer'
import { getInfluencerVersionForUser } from '@/lib/influencers/authorize-version'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; versionId: string }> | { id: string; versionId: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: influencerId, versionId } = await Promise.resolve(params)
    const gate = await getInfluencerVersionForUser(
      session.user.id,
      influencerId,
      versionId
    )
    if (!gate.ok) {
      const st = gate.error === 'FORBIDDEN' ? 403 : 404
      return NextResponse.json({ error: st === 403 ? 'Forbidden' : 'Not found' }, { status: st })
    }

    const refs = await prisma.aIInfluencerReferenceAsset.findMany({
      where: { versionId },
      include: {
        mediaAsset: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            mediaType: true,
            cdnUrl: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ references: refs })
  } catch (e) {
    console.error('GET .../references', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; versionId: string }> | { id: string; versionId: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: influencerId, versionId } = await Promise.resolve(params)
    const gate = await getInfluencerVersionForUser(
      session.user.id,
      influencerId,
      versionId
    )
    if (!gate.ok) {
      const st = gate.error === 'FORBIDDEN' ? 403 : 404
      return NextResponse.json({ error: st === 403 ? 'Forbidden' : 'Not found' }, { status: st })
    }

    if (gate.row.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Versão LOCKED: não é possível adicionar referências.' },
        { status: 409 }
      )
    }

    const json = await request.json()
    const parsed = influencerReferenceBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const tenantId = gate.row.influencer.tenantId
    const asset = await prisma.mediaAsset.findFirst({
      where: { id: parsed.data.mediaAssetId, tenantId },
      select: { id: true },
    })
    if (!asset) {
      return NextResponse.json(
        { error: 'MediaAsset não encontrado neste workspace.' },
        { status: 400 }
      )
    }

    const created = await prisma.aIInfluencerReferenceAsset.create({
      data: {
        versionId,
        mediaAssetId: parsed.data.mediaAssetId,
        role: parsed.data.role ?? 'OTHER',
        metadata: (parsed.data.metadata ?? {}) as object,
      },
      include: {
        mediaAsset: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            cdnUrl: true,
            thumbnailUrl: true,
          },
        },
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    console.error('POST .../references', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
