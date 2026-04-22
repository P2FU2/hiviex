/**
 * Enfileira transcrição (stub) de uma fonte — quota video_transcribe.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { tryReserveMonthlyUsage, releaseMonthlyUsage } from '@/lib/billing/usage'
import { getVideoSourceForUser } from '@/lib/video/authorize-source'
import { submitVideoTranscribeJob } from '@/lib/video/submit-transcribe-job'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ projectId: string; sourceId: string }> | { projectId: string; sourceId: string }
  }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, sourceId } = await Promise.resolve(params)
    const gate = await getVideoSourceForUser(session.user.id, projectId, sourceId)
    if (!gate.ok) {
      const st =
        gate.error === 'FORBIDDEN'
          ? 403
          : gate.error === 'SOURCE_NOT_FOUND'
            ? 404
            : 404
      return NextResponse.json(
        { error: st === 403 ? 'Forbidden' : 'Not found' },
        { status: st }
      )
    }

    const tenantId = gate.project.tenantId

    const reserved = await tryReserveMonthlyUsage(tenantId, 1, 'video_transcribe')
    if (!reserved) {
      return NextResponse.json(
        {
          error: 'Limite mensal de utilização atingido para este workspace.',
          code: 'USAGE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      )
    }

    const submitted = await submitVideoTranscribeJob({
      tenantId,
      projectId,
      sourceId,
      quotaAlreadyReserved: true,
    })

    if (!submitted.ok) {
      await releaseMonthlyUsage(tenantId, 1)
      return NextResponse.json(
        { error: 'Falha ao enfileirar transcrição', message: submitted.message },
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
    console.error('POST .../transcribe', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
