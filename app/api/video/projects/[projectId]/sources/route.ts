/**
 * Fontes de vídeo de um projeto — listar e adicionar (URL ou upload), com fila de ingest.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { createVideoSourceBodySchema } from '@/lib/validators/video-source'
import { getVideoProjectForUser } from '@/lib/video/authorize-project'
import { tryReserveMonthlyUsage, releaseMonthlyUsage } from '@/lib/billing/usage'
import { submitVideoIngestJob } from '@/lib/video/submit-ingest-job'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
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

    const sources = await prisma.videoSource.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({ sources })
  } catch (e) {
    console.error('GET /api/video/projects/.../sources', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const tenantId = gate.project.tenantId

    const reserved = await tryReserveMonthlyUsage(tenantId, 1, 'video_ingest')
    if (!reserved) {
      return NextResponse.json(
        {
          error: 'Limite mensal de utilização atingido para este workspace.',
          code: 'USAGE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    const json = await request.json()
    const parsed = createVideoSourceBodySchema.safeParse(json)
    if (!parsed.success) {
      await releaseMonthlyUsage(tenantId, 1)
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const body = parsed.data
    let mediaAssetId: string | null = null

    if (body.type === 'UPLOAD') {
      const asset = await prisma.mediaAsset.findFirst({
        where: { id: body.mediaAssetId, tenantId },
        select: { id: true },
      })
      if (!asset) {
        await releaseMonthlyUsage(tenantId, 1)
        return NextResponse.json(
          { error: 'MediaAsset não encontrado neste workspace.' },
          { status: 400 }
        )
      }
      mediaAssetId = body.mediaAssetId
    }

    const source = await prisma.videoSource.create({
      data: {
        projectId,
        type: body.type,
        sourceUrl: body.type === 'URL' ? body.sourceUrl : null,
        mediaAssetId,
        ingestStatus: 'PENDING',
        metadata: (body.metadata ?? {}) as object,
      },
    })

    const submitted = await submitVideoIngestJob({
      tenantId,
      projectId,
      sourceId: source.id,
      quotaAlreadyReserved: true,
    })

    if (!submitted.ok) {
      await releaseMonthlyUsage(tenantId, 1)
      await prisma.videoSource.update({
        where: { id: source.id },
        data: { ingestStatus: 'FAILED' },
      })
      return NextResponse.json(
        {
          error: 'Falha ao enfileirar ingestão',
          message: submitted.message,
        },
        { status: 502 }
      )
    }

    const withMedia = await prisma.videoSource.findUnique({
      where: { id: source.id },
      include: {
        mediaAsset: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            cdnUrl: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        source: withMedia,
        generationJobId: submitted.generationJobId,
        bullJobId: submitted.bullJobId,
      },
      { status: 201 }
    )
  } catch (e) {
    console.error('POST /api/video/projects/.../sources', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
