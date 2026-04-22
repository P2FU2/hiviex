/**
 * Video factory — projetos (MVP: CRUD mínimo; pipeline assíncrono nas próximas iterações).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createProjectSchema = z.object({
  tenantId: z.string().cuid(),
  title: z.string().min(1).max(200),
  influencerId: z.string().cuid().optional(),
  influencerVersionId: z.string().cuid().optional(),
  config: z.record(z.unknown()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId')?.trim()
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const ok = await hasTenantPermission(session.user.id, tenantId, 'MEMBER')
    if (!ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const projects = await prisma.videoProject.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        status: true,
        influencerId: true,
        influencerVersionId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ projects })
  } catch (e) {
    console.error('GET /api/video/projects', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = createProjectSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      tenantId,
      title,
      influencerId,
      influencerVersionId,
      config,
    } = parsed.data

    const allowed = await hasTenantPermission(session.user.id, tenantId, 'MEMBER')
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (influencerId) {
      const inf = await prisma.aIInfluencer.findFirst({
        where: { id: influencerId, tenantId },
        select: { id: true },
      })
      if (!inf) {
        return NextResponse.json({ error: 'Influenciador inválido' }, { status: 400 })
      }
    }

    let resolvedInfluencerId = influencerId ?? null
    if (influencerVersionId) {
      const ver = await prisma.aIInfluencerVersion.findFirst({
        where: {
          id: influencerVersionId,
          influencer: { tenantId },
        },
        select: { id: true, influencerId: true },
      })
      if (!ver) {
        return NextResponse.json({ error: 'Versão de influenciador inválida' }, { status: 400 })
      }
      if (resolvedInfluencerId && ver.influencerId !== resolvedInfluencerId) {
        return NextResponse.json(
          { error: 'Versão não pertence ao influenciador indicado' },
          { status: 400 }
        )
      }
      resolvedInfluencerId = ver.influencerId
    }

    const project = await prisma.videoProject.create({
      data: {
        tenantId,
        createdByUserId: session.user.id,
        title,
        status: 'DRAFT',
        influencerId: resolvedInfluencerId,
        influencerVersionId: influencerVersionId ?? null,
        config: (config ?? {}) as object,
      },
    })

    await prisma.videoEditSession.create({
      data: {
        projectId: project.id,
        state: {
          captions: [],
          musicTrackId: null,
          voicePreset: null,
        } as object,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (e) {
    console.error('POST /api/video/projects', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
