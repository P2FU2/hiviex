/**
 * Detalhe de um MediaAsset (tenant + membro).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await Promise.resolve(params)
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

    const asset = await prisma.mediaAsset.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        fileName: true,
        mimeType: true,
        mediaType: true,
        fileSize: true,
        s3Key: true,
        cdnUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        duration: true,
        processed: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!asset) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      asset: {
        ...asset,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('media [id] GET error:', error)
    return NextResponse.json({ error: 'Falha ao obter mídia' }, { status: 500 })
  }
}
