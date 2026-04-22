/**
 * Enfileira geração de identity pack ou preview (quota + GenerationJob + BullMQ).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { influencerGenerateJobBodySchema } from '@/lib/validators/influencer'
import { getInfluencerVersionForUser } from '@/lib/influencers/authorize-version'
import { submitInfluencerGenerationJob } from '@/lib/influencers/submit-generation-job'

export const dynamic = 'force-dynamic'

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
        { error: 'Versão LOCKED não aceita novos jobs de geração.' },
        { status: 409 }
      )
    }

    const json = await request.json()
    const parsed = influencerGenerateJobBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const tenantId = gate.row.influencer.tenantId
    const result = await submitInfluencerGenerationJob({
      tenantId,
      influencerId,
      versionId,
      jobType: parsed.data.jobType,
    })

    if (result.ok === false) {
      if (result.error === 'QUOTA') {
        return NextResponse.json(
          {
            error: 'Limite mensal de utilização atingido para este workspace.',
            code: 'USAGE_LIMIT_EXCEEDED',
          },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: 'Falha ao enfileirar job', message: result.message },
        { status: 502 }
      )
    }

    return NextResponse.json(
      {
        generationJobId: result.generationJobId,
        idempotencyKey: result.idempotencyKey,
        bullJobId: result.bullJobId,
      },
      { status: 202 }
    )
  } catch (e) {
    console.error('POST .../generate', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
