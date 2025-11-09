/**
 * Publishing Worker
 * 
 * Worker BullMQ para processar jobs de publicação em redes sociais
 */

import { Worker, Job } from 'bullmq'
import { prisma } from '@/lib/db/prisma'
import { createProvider } from '@/lib/integrations/providers'
import type { SocialPlatform } from '@/lib/types/domain'

interface PublishingJobData {
  scheduledPostId: string
  tenantId: string
  platform: SocialPlatform
}

export class PublishingWorker {
  private worker: Worker

  constructor(connection: { host: string; port: number; password?: string }) {
    this.worker = new Worker(
      'publishing',
      async (job: Job<PublishingJobData>) => {
        return await this.processPublishingJob(job)
      },
      {
        connection,
        concurrency: 5, // Processa 5 jobs simultaneamente
        removeOnComplete: {
          count: 100, // Mantém últimos 100 jobs completos
          age: 24 * 3600, // 24 horas
        },
        removeOnFail: {
          count: 1000, // Mantém últimos 1000 jobs falhos
        },
      }
    )

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      console.log(`[PublishingWorker] Job ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      console.error(`[PublishingWorker] Job ${job?.id} failed:`, err)
    })

    this.worker.on('error', (err) => {
      console.error('[PublishingWorker] Error:', err)
    })
  }

  private async processPublishingJob(job: Job<PublishingJobData>) {
    const { scheduledPostId, tenantId, platform } = job.data

    // 1. Buscar post agendado
    const post = await (prisma as any).scheduledPost.findUnique({
      where: { id: scheduledPostId },
      include: {
        socialAccount: true,
        mediaAssets: true,
      },
    })

    if (!post) {
      throw new Error(`Scheduled post ${scheduledPostId} not found`)
    }

    // 2. Atualizar status para PUBLISHING
    await (prisma as any).scheduledPost.update({
      where: { id: scheduledPostId },
      data: { status: 'PUBLISHING' },
    })

    // 3. Atualizar job status
    await (prisma as any).publishingJob.update({
      where: { jobId: job.id! },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
        attempts: job.attemptsMade + 1,
      },
    })

    try {
      // 4. Buscar tokens OAuth (descriptografar se necessário)
      const account = post.socialAccount
      const tokens = {
        accessToken: account.accessToken, // TODO: Descriptografar
        refreshToken: account.refreshToken, // TODO: Descriptografar
        expiresAt: account.tokenExpiresAt,
      }

      // 5. Verificar/renovar tokens se necessário
      const provider = createProvider(platform)
      const isValid = await provider.validateTokens(tokens)

      if (!isValid && tokens.refreshToken) {
        const newTokens = await provider.refreshTokens(tokens.refreshToken)
        // TODO: Atualizar tokens no banco (criptografar)
      }

      // 6. Preparar URLs das mídias
      const mediaUrls = post.mediaAssets.map((asset: any) => asset.cdnUrl || asset.s3Key)

      // 7. Publicar
      const result = await provider.publishPost(tokens, mediaUrls, {
        title: post.title || undefined,
        caption: post.caption || undefined,
        hashtags: post.hashtags,
        mentions: post.mentions,
        scheduledAt: post.scheduledAt,
        metadata: {
          pageId: account.platformPageId,
          igUserId: account.metadata?.igUserId,
        },
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to publish')
      }

      // 8. Atualizar post com resultado
      await (prisma as any).scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          platformPostId: result.postId,
          platformPostUrl: result.postUrl,
        },
      })

      // 9. Atualizar job
      await (prisma as any).publishingJob.update({
        where: { jobId: job.id! },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          result: result,
        },
      })

      return result
    } catch (error: any) {
      // Atualizar post com erro
      await (prisma as any).scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      })

      // Atualizar job com erro
      await (prisma as any).publishingJob.update({
        where: { jobId: job.id! },
        data: {
          status: 'FAILED',
          error: error.message,
          errorStack: error.stack,
        },
      })

      throw error
    }
  }

  async close() {
    await this.worker.close()
  }
}

