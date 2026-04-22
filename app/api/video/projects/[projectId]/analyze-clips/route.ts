/**
 * Enfileira análise de cortes candidatos (stub) — quota video_analysis.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { tryReserveMonthlyUsage, releaseMonthlyUsage } from '@/lib/billing/usage'
import { getVideoProjectForUser } from '@/lib/video/authorize-project'
import { submitVideoClipAnalysisJob } from '@/lib/video/submit-clip-analysis-job'
import { analyzeClipsBodySchema } from '@/lib/validators/video-source'

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

    const json = await request.json().catch(() => ({}))
    const parsed = analyzeClipsBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const sourceId = parsed.data.sourceId ?? null
    if (sourceId) {
      const src = await prisma.videoSource.findFirst({
        where: { id: sourceId, projectId },
        select: { id: true },
      })
      if (!src) {
        return NextResponse.json({ error: 'Fonte inválida para este projeto' }, { status: 400 })
      }
    }

    const tenantId = gate.project.tenantId

    const reserved = await tryReserveMonthlyUsage(tenantId, 1, 'video_analysis')
    if (!reserved) {
      return NextResponse.json(
        {
          error: 'Limite mensal de utilização atingido para este workspace.',
          code: 'USAGE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    const submitted = await submitVideoClipAnalysisJob({
      tenantId,
      projectId,
      sourceId,
      quotaAlreadyReserved: true,
    })

    if (!submitted.ok) {
      await releaseMonthlyUsage(tenantId, 1)
      return NextResponse.json(
        { error: 'Falha ao enfileirar análise', message: submitted.message },
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
    console.error('POST .../analyze-clips', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
