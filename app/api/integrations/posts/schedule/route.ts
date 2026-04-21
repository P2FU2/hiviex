/**
 * Schedule Post API
 * 
 * Agenda um post para publicaÃ§Ã£o em mÃºltiplas plataformas
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { PublishingQueue } from '@/lib/queue/publishing-queue'
import type { SocialPlatform } from '@/lib/types/domain'
import { getBullMQConnection } from '@/lib/redis/bullmq-connection'

export const dynamic = 'force-dynamic'

const getQueue = () => new PublishingQueue(getBullMQConnection())

export async function POST(request: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      tenantId,
      socialAccountId,
      platform,
      contentType,
      title,
      caption,
      hashtags = [],
      mentions = [],
      scheduledAt,
      mediaAssetIds = [],
      config = {},
    } = body

    // Validar acesso
    const tenantMemberships = await getUserTenants(session.user.id)
    const hasAccess = tenantMemberships.some((tm: any) => tm.tenantId === tenantId)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validar conta social
    const account = await (prisma as any).socialAccount.findFirst({
      where: {
        id: socialAccountId,
        tenantId,
        platform,
        status: 'CONNECTED',
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Social account not found or disconnected' }, { status: 404 })
    }

    // Validar mÃ­dias
    if (mediaAssetIds.length > 0) {
      const mediaAssets = await (prisma as any).mediaAsset.findMany({
        where: {
          id: { in: mediaAssetIds },
          tenantId,
        },
      })

      if (mediaAssets.length !== mediaAssetIds.length) {
        return NextResponse.json({ error: 'Some media assets not found' }, { status: 404 })
      }
    }

    // Criar post agendado
    const post = await (prisma as any).scheduledPost.create({
      data: {
        tenantId,
        socialAccountId,
        platform,
        contentType,
        title,
        caption,
        hashtags,
        mentions,
        scheduledAt: new Date(scheduledAt),
        status: 'SCHEDULED',
        config,
        mediaAssets: {
          connect: mediaAssetIds.map((id: string) => ({ id })),
        },
      },
      include: {
        mediaAssets: true,
      },
    })

    // Criar job no BullMQ
    const queue = getQueue()
    const jobId = await queue.schedulePost(
      post.id,
      tenantId,
      platform as SocialPlatform,
      new Date(scheduledAt)
    )

    // Salvar job no banco
    await (prisma as any).publishingJob.create({
      data: {
        tenantId,
        scheduledPostId: post.id,
        jobId,
        status: 'PENDING',
        scheduledFor: new Date(scheduledAt),
      },
    })

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        scheduledAt: post.scheduledAt,
        status: post.status,
      },
      jobId,
    })
  } catch (error: any) {
    console.error('Schedule post error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to schedule post' },
      { status: 500 }
    )
  }
}

