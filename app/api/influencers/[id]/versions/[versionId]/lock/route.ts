/**
 * Bloqueia versão (LOCKED) — apenas a partir de APPROVED.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getInfluencerVersionForUser } from '@/lib/influencers/authorize-version'
import { hasTenantPermission } from '@/lib/utils/tenant'

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

    const isAdmin = await hasTenantPermission(
      session.user.id,
      gate.row.influencer.tenantId,
      'ADMIN'
    )
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem bloquear versões (LOCKED).' },
        { status: 403 }
      )
    }

    if (gate.row.status === 'LOCKED') {
      const row = await prisma.aIInfluencerVersion.findUnique({ where: { id: versionId } })
      return NextResponse.json(row)
    }
    if (gate.row.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Apenas versões APPROVED podem ser bloqueadas (LOCKED).' },
        { status: 409 }
      )
    }

    const updated = await prisma.aIInfluencerVersion.update({
      where: { id: versionId },
      data: {
        status: 'LOCKED',
        lockedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('POST .../lock', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
