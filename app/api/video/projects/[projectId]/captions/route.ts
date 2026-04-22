/**
 * Legendas do projeto — listar e criar.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getVideoProjectForUser } from '@/lib/video/authorize-project'
import { createCaptionTrackSchema } from '@/lib/validators/video-captions'

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

    const tracks = await prisma.captionTrack.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ tracks })
  } catch (e) {
    console.error('GET .../captions', e)
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

    const body = await request.json()
    const parsed = createCaptionTrackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const track = await prisma.captionTrack.create({
      data: {
        projectId,
        locale: parsed.data.locale ?? 'pt-BR',
        stylePreset: parsed.data.stylePreset ?? null,
        segments: parsed.data.segments as object,
      },
    })

    return NextResponse.json(track, { status: 201 })
  } catch (e) {
    console.error('POST .../captions', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
