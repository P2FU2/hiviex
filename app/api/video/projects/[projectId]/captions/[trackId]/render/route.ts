/**
 * Enfileira queima de legendas num MediaAsset de vídeo — quota video_render.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { tryReserveMonthlyUsage, releaseMonthlyUsage } from '@/lib/billing/usage'
import { getVideoProjectForUser } from '@/lib/video/authorize-project'
import { captionRenderBodySchema } from '@/lib/validators/video-captions'
import { submitCaptionRenderJob } from '@/lib/video/submit-caption-render-job'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ projectId: string; trackId: string }> | { projectId: string; trackId: string }
  }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, trackId } = await Promise.resolve(params)
    const gate = await getVideoProjectForUser(session.user.id, projectId)
    if (!gate.ok) {
      const st = gate.error === 'FORBIDDEN' ? 403 : 404
      return NextResponse.json({ error: st === 403 ? 'Forbidden' : 'Not found' }, { status: st })
    }

    const track = await prisma.captionTrack.findFirst({
      where: { id: trackId, projectId },
    })
    if (!track) {
      return NextResponse.json({ error: 'Faixa não encontrada' }, { status: 404 })
    }

    const json = await request.json()
    const parsed = captionRenderBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const tenantId = gate.project.tenantId
    const src = await prisma.mediaAsset.findFirst({
      where: { id: parsed.data.sourceMediaAssetId, tenantId },
      select: { id: true, mediaType: true },
    })
    if (!src) {
      return NextResponse.json({ error: 'MediaAsset inválido' }, { status: 400 })
    }
    if (src.mediaType !== 'VIDEO') {
      return NextResponse.json(
        { error: 'O ficheiro de origem tem de ser vídeo.' },
        { status: 400 }
      )
    }

    const reserved = await tryReserveMonthlyUsage(tenantId, 1, 'video_render')
    if (!reserved) {
      return NextResponse.json(
        {
          error: 'Limite mensal de utilização atingido para este workspace.',
          code: 'USAGE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    const submitted = await submitCaptionRenderJob({
      tenantId,
      projectId,
      captionTrackId: trackId,
      sourceMediaAssetId: parsed.data.sourceMediaAssetId,
      quotaAlreadyReserved: true,
    })

    if (!submitted.ok) {
      await releaseMonthlyUsage(tenantId, 1)
      return NextResponse.json(
        { error: 'Falha ao enfileirar render de legendas', message: submitted.message },
        { status: 502 }
      )
    }

    return NextResponse.json(
      {
        generationJobId: submitted.generationJobId,
        bullJobId: submitted.bullJobId,
      },
      { status: 202 }
    )
  } catch (e) {
    console.error('POST .../captions/.../render', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
