/**
 * Uma versão concreta — GET e PATCH (bloqueado se LOCKED).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import { patchInfluencerVersionBodySchema } from '@/lib/validators/influencer'
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

    const full = await prisma.aIInfluencerVersion.findUnique({
      where: { id: versionId },
      include: {
        voiceProfile: true,
        referenceAssets: {
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
        },
      },
    })

    return NextResponse.json(full)
  } catch (e) {
    console.error('GET /api/influencers/.../versions/[versionId]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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
        { error: 'Versão bloqueada (LOCKED); não é editável.' },
        { status: 409 }
      )
    }

    const body = await request.json()
    const parsed = patchInfluencerVersionBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const d = parsed.data
    const jsonOrNull = (v: Record<string, unknown> | null | undefined) =>
      v === null ? Prisma.JsonNull : (v as Prisma.InputJsonValue)

    const updated = await prisma.aIInfluencerVersion.update({
      where: { id: versionId },
      data: {
        ...(d.identityPack !== undefined
          ? { identityPack: jsonOrNull(d.identityPack) }
          : {}),
        ...(d.promptBlueprint !== undefined ? { promptBlueprint: d.promptBlueprint } : {}),
        ...(d.negativePromptBlueprint !== undefined
          ? { negativePromptBlueprint: d.negativePromptBlueprint }
          : {}),
        ...(d.brandPersona !== undefined ? { brandPersona: jsonOrNull(d.brandPersona) } : {}),
        ...(d.platformGuidelines !== undefined
          ? { platformGuidelines: jsonOrNull(d.platformGuidelines) }
          : {}),
        ...(d.notes !== undefined ? { notes: d.notes } : {}),
      },
      include: {
        voiceProfile: true,
        referenceAssets: true,
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /api/influencers/.../versions/[versionId]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
