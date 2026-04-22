/**
 * Remove referência MediaAsset da versão.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getInfluencerVersionForUser } from '@/lib/influencers/authorize-version'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ id: string; versionId: string; referenceId: string }>
      | { id: string; versionId: string; referenceId: string }
  }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: influencerId, versionId, referenceId } = await Promise.resolve(params)
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
        { error: 'Versão LOCKED: não é possível remover referências.' },
        { status: 409 }
      )
    }

    const ref = await prisma.aIInfluencerReferenceAsset.findFirst({
      where: { id: referenceId, versionId },
    })
    if (!ref) {
      return NextResponse.json({ error: 'Referência não encontrada' }, { status: 404 })
    }

    await prisma.aIInfluencerReferenceAsset.delete({ where: { id: referenceId } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE .../references/[referenceId]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
