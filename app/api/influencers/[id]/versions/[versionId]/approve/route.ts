/**
 * Marca versão como APPROVED (a partir de DRAFT ou PENDING_REVIEW).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getInfluencerVersionForUser } from '@/lib/influencers/authorize-version'

export const dynamic = 'force-dynamic'

export async function POST(
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

    if (gate.row.status === 'LOCKED') {
      return NextResponse.json({ error: 'Já está LOCKED.' }, { status: 409 })
    }
    if (gate.row.status === 'APPROVED') {
      const row = await prisma.aIInfluencerVersion.findUnique({ where: { id: versionId } })
      return NextResponse.json(row)
    }
    if (gate.row.status !== 'DRAFT' && gate.row.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Só DRAFT ou PENDING_REVIEW podem ser aprovados.' },
        { status: 409 }
      )
    }

    const updated = await prisma.aIInfluencerVersion.update({
      where: { id: versionId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('POST .../approve', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
