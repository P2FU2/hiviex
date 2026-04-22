/**
 * Export final (mux vídeo + áudio opcional) — quota video_render.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { tryReserveMonthlyUsage, releaseMonthlyUsage } from '@/lib/billing/usage'
import { getVideoProjectForUser } from '@/lib/video/authorize-project'
import { finalMuxBodySchema } from '@/lib/validators/video-captions'
import { submitFinalMuxJob } from '@/lib/video/submit-final-mux-job'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> | { projectId: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await Promise.resolve(params)
    const gate = await getVideoProjectForUser(session.user.id, projectId)
    if (!gate.ok) {
      const st = gate.error === 'FORBIDDEN' ? 403 : 404
      return NextResponse.json({ error: st === 403 ? 'Forbidden' : 'Not found' }, { status: st })
    }

    const json = await request.json()
    const parsed = finalMuxBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const tenantId = gate.project.tenantId
    const { videoMediaAssetId, audioMediaAssetId, audioUrl } = parsed.data

    const video = await prisma.mediaAsset.findFirst({
      where: { id: videoMediaAssetId, tenantId },
      select: { mediaType: true },
    })
    if (!video || video.mediaType !== 'VIDEO') {
      return NextResponse.json({ error: 'Vídeo principal inválido' }, { status: 400 })
    }

    if (audioMediaAssetId) {
      const a = await prisma.mediaAsset.findFirst({
        where: { id: audioMediaAssetId, tenantId },
        select: { mediaType: true },
      })
      if (!a || a.mediaType !== 'AUDIO') {
        return NextResponse.json({ error: 'Áudio (MediaAsset) inválido' }, { status: 400 })
      }
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

    const submitted = await submitFinalMuxJob({
      tenantId,
      projectId,
      videoMediaAssetId,
      audioMediaAssetId: audioMediaAssetId ?? null,
      audioUrl: audioUrl ?? null,
      quotaAlreadyReserved: true,
    })

    if (!submitted.ok) {
      await releaseMonthlyUsage(tenantId, 1)
      return NextResponse.json(
        { error: 'Falha ao enfileirar export final', message: submitted.message },
        { status: 502 }
      )
    }

    await prisma.videoProject.update({
      where: { id: projectId },
      data: { status: 'RENDERING' },
    })

    return NextResponse.json(
      {
        generationJobId: submitted.generationJobId,
        bullJobId: submitted.bullJobId,
      },
      { status: 202 }
    )
  } catch (e) {
    console.error('POST .../export/final', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
