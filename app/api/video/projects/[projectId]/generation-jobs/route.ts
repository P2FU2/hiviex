/**
 * Jobs de geração ligados ao projeto (auditoria / estado).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getVideoProjectForUser } from '@/lib/video/authorize-project'

export const dynamic = 'force-dynamic'

export async function GET(
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

    const take = Math.min(
      50,
      Math.max(1, parseInt(request.nextUrl.searchParams.get('take') || '20', 10) || 20)
    )

    const jobs = await prisma.generationJob.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        type: true,
        status: true,
        idempotencyKey: true,
        bullJobId: true,
        error: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        ...j,
        createdAt: j.createdAt.toISOString(),
        updatedAt: j.updatedAt.toISOString(),
      })),
    })
  } catch (e) {
    console.error('GET .../generation-jobs', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
