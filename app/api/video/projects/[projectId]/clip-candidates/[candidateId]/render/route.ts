/**
 * Enfileira render de clip (MVP: marca RENDERED via worker) — quota video_render.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { tryReserveMonthlyUsage, releaseMonthlyUsage } from '@/lib/billing/usage'
import { getVideoProjectForUser } from '@/lib/video/authorize-project'
import { submitVideoClipRenderJob } from '@/lib/video/submit-clip-render-job'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ projectId: string; candidateId: string }>
      | { projectId: string; candidateId: string }
  }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, candidateId } = await Promise.resolve(params)
    const gate = await getVideoProjectForUser(session.user.id, projectId)
    if (!gate.ok) {
      const st = gate.error === 'FORBIDDEN' ? 403 : 404
      return NextResponse.json({ error: st === 403 ? 'Forbidden' : 'Not found' }, { status: st })
    }

    const candidate = await prisma.videoClipCandidate.findFirst({
      where: { id: candidateId, projectId },
    })
    if (!candidate) {
      return NextResponse.json({ error: 'Candidato não encontrado' }, { status: 404 })
    }
    if (candidate.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Apenas candidatos APPROVED podem ser renderizados.' },
        { status: 409 }
      )
    }

    const tenantId = gate.project.tenantId

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

    const submitted = await submitVideoClipRenderJob({
      tenantId,
      projectId,
      candidateId,
      quotaAlreadyReserved: true,
    })

    if (!submitted.ok) {
      await releaseMonthlyUsage(tenantId, 1)
      return NextResponse.json(
        { error: 'Falha ao enfileirar render', message: submitted.message },
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
    console.error('POST .../render', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
