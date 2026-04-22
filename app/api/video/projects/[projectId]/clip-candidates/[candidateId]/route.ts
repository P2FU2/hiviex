/**
 * Atualizar estado de um candidato a clip (aprovar / rejeitar).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getVideoProjectForUser } from '@/lib/video/authorize-project'
import { patchClipCandidateSchema } from '@/lib/validators/video-project'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
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

    if (candidate.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Só é possível alterar candidatos em PENDING.' },
        { status: 409 }
      )
    }

    const body = await request.json()
    const parsed = patchClipCandidateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.videoClipCandidate.update({
      where: { id: candidateId },
      data: { status: parsed.data.status },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH .../clip-candidates/[candidateId]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
