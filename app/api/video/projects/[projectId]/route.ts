/**
 * Detalhe do projeto — GET e PATCH (título).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getVideoProjectForUser } from '@/lib/video/authorize-project'
import { patchVideoProjectSchema } from '@/lib/validators/video-project'

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

    const project = await prisma.videoProject.findUnique({
      where: { id: projectId },
      include: {
        _count: { select: { sources: true, clipCandidates: true, generationJobs: true } },
      },
    })

    return NextResponse.json({ project })
  } catch (e) {
    console.error('GET /api/video/projects/[projectId]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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
    const parsed = patchVideoProjectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    if (parsed.data.title === undefined) {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
    }

    const updated = await prisma.videoProject.update({
      where: { id: projectId },
      data: { title: parsed.data.title },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('PATCH /api/video/projects/[projectId]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
