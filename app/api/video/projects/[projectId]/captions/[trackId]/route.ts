/**
 * Atualizar ou apagar faixa de legendas.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getVideoProjectForUser } from '@/lib/video/authorize-project'
import { patchCaptionTrackSchema } from '@/lib/validators/video-captions'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ projectId: string; trackId: string }> | { projectId: string; trackId: string }
  }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, trackId } = await Promise.resolve(params)
    const gate = await getVideoProjectForUser(session.user.id, projectId)
    if (!gate.ok) {
      const st = gate.error === 'FORBIDDEN' ? 403 : 404
      return NextResponse.json({ error: st === 403 ? 'Forbidden' : 'Not found' }, { status: st })
    }

    const existing = await prisma.captionTrack.findFirst({
      where: { id: trackId, projectId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = patchCaptionTrackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const d = parsed.data
    if (
      d.locale === undefined &&
      d.stylePreset === undefined &&
      d.segments === undefined
    ) {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
    }

    const updated = await prisma.captionTrack.update({
      where: { id: trackId },
      data: {
        ...(d.locale !== undefined ? { locale: d.locale } : {}),
        ...(d.stylePreset !== undefined ? { stylePreset: d.stylePreset } : {}),
        ...(d.segments !== undefined ? { segments: d.segments as object } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH .../captions/[trackId]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ projectId: string; trackId: string }> | { projectId: string; trackId: string }
  }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, trackId } = await Promise.resolve(params)
    const gate = await getVideoProjectForUser(session.user.id, projectId)
    if (!gate.ok) {
      const st = gate.error === 'FORBIDDEN' ? 403 : 404
      return NextResponse.json({ error: st === 403 ? 'Forbidden' : 'Not found' }, { status: st })
    }

    const existing = await prisma.captionTrack.findFirst({
      where: { id: trackId, projectId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.captionTrack.delete({ where: { id: trackId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE .../captions/[trackId]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
