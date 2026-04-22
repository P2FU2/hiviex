/**
 * Versões de um influenciador — listar e criar.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { newVersionBodySchema } from '@/lib/validators/influencer'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: influencerId } = await Promise.resolve(params)
    const inf = await prisma.aIInfluencer.findUnique({
      where: { id: influencerId },
      select: { id: true, tenantId: true },
    })
    if (!inf) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const ok = await hasTenantPermission(session.user.id, inf.tenantId, 'MEMBER')
    if (!ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const versions = await prisma.aIInfluencerVersion.findMany({
      where: { influencerId },
      orderBy: { version: 'desc' },
      include: {
        voiceProfile: true,
        _count: { select: { referenceAssets: true } },
      },
    })

    return NextResponse.json({ versions })
  } catch (e) {
    console.error('GET /api/influencers/[id]/versions', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const { id: influencerId } = await Promise.resolve(params)
    const inf = await prisma.aIInfluencer.findUnique({
      where: { id: influencerId },
    })
    if (!inf) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const allowed = await hasTenantPermission(session.user.id, inf.tenantId, 'MEMBER')
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const json = await request.json()
    const parsed = newVersionBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const maxRow = await prisma.aIInfluencerVersion.aggregate({
      where: { influencerId },
      _max: { version: true },
    })
    const nextV = (maxRow._max.version ?? 0) + 1

    let base: {
      identityPack: unknown
      promptBlueprint: string | null
      negativePromptBlueprint: string | null
      brandPersona: unknown
    } | null = null

    if (parsed.data.copyFromVersion !== undefined) {
      base = await prisma.aIInfluencerVersion.findFirst({
        where: { influencerId, version: parsed.data.copyFromVersion },
        select: {
          identityPack: true,
          promptBlueprint: true,
          negativePromptBlueprint: true,
          brandPersona: true,
        },
      })
      if (!base) {
        return NextResponse.json({ error: 'Versão base não encontrada' }, { status: 404 })
      }
    }

    const created = await prisma.aIInfluencerVersion.create({
      data: {
        influencerId,
        version: nextV,
        status: 'DRAFT',
        identityPack: (parsed.data.identityPack ??
          base?.identityPack ?? {
            summary: `Versão ${nextV}`,
          }) as object,
        promptBlueprint:
          parsed.data.promptBlueprint ?? base?.promptBlueprint ?? null,
        negativePromptBlueprint:
          parsed.data.negativePromptBlueprint ?? base?.negativePromptBlueprint ?? null,
        brandPersona: (parsed.data.brandPersona ?? base?.brandPersona ?? undefined) as
          | object
          | undefined,
      },
    })

    await prisma.aIInfluencer.update({
      where: { id: influencerId },
      data: { currentVersionId: created.id },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    console.error('POST /api/influencers/[id]/versions', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
