/**
 * Lista MediaAsset do tenant (biblioteca de mídia).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId')
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 })
    }

    const memberships = await getUserTenants(session.user.id)
    const allowed = memberships.some(
      (m: { tenantId: string }) => m.tenantId === tenantId
    )
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const take = Math.min(
      100,
      Math.max(1, parseInt(request.nextUrl.searchParams.get('take') || '40', 10) || 40)
    )

    const assets = await prisma.mediaAsset.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        mediaType: true,
        fileSize: true,
        s3Key: true,
        cdnUrl: true,
        thumbnailUrl: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      assets: assets.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('media list error:', error)
    return NextResponse.json({ error: 'Falha ao listar mídia' }, { status: 500 })
  }
}
