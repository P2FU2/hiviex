/**
 * Publishing Worker
 * 
 * Worker BullMQ para processar jobs de publicação em redes sociais
 */

import { Worker, Job } from 'bullmq'
import { prisma } from '@/lib/db/prisma'
import { createProvider } from '@/lib/integrations/providers'
import type { SocialPlatform } from '@/lib/types/domain'
import { decrypt, encrypt } from '@/lib/utils/encryption'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'
import { resolveAssetPublicUrl } from '@/lib/storage/object-storage'
import { createLogger } from '@/lib/observability/logger'
import { createTenantNotification } from '@/lib/notifications/service'

const log = createLogger('publishing-worker')

interface PublishingJobData {
  scheduledPostId: string
  tenantId: string
  platform: SocialPlatform
}

export class PublishingWorker {
  private worker: Worker

  constructor(connection: BullMQConnection) {
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
      log.debug('job completed', { jobId: job.id })
    })

    this.worker.on('failed', (job, err) => {
      log.error('job failed', err, { jobId: job?.id })
    })

    this.worker.on('error', (err) => {
      log.error('worker error', err)
    })
  }

  private async processPublishingJob(job: Job<PublishingJobData>) {
    const { scheduledPostId, tenantId, platform } = job.data
    const t0 = Date.now()

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

    if (post.tenantId !== tenantId) {
      throw new Error(
        `Scheduled post ${scheduledPostId} tenant mismatch — job recusado.`
      )
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
      const account = post.socialAccount
      let accessTokenPlain = decrypt(account.accessToken)
      let refreshTokenPlain = account.refreshToken
        ? decrypt(account.refreshToken)
        : undefined

      const pageTokEnc =
        (platform === 'INSTAGRAM' || platform === 'FACEBOOK') &&
        account.metadata &&
        typeof account.metadata === 'object'
          ? (account.metadata as Record<string, unknown>).pageAccessTokenEnc
          : undefined
      if (
        (platform === 'INSTAGRAM' || platform === 'FACEBOOK') &&
        typeof pageTokEnc === 'string' &&
        pageTokEnc.length > 0
      ) {
        const pageTok = decrypt(pageTokEnc)
        if (pageTok) {
          accessTokenPlain = pageTok
        }
      }

      const tokens = {
        accessToken: accessTokenPlain,
        refreshToken: refreshTokenPlain,
        expiresAt: account.tokenExpiresAt ?? undefined,
      }

      const provider = createProvider(platform)
      const isValid = await provider.validateTokens(tokens)

      if (!isValid && refreshTokenPlain) {
        try {
          const newTokens = await provider.refreshTokens(refreshTokenPlain)
          accessTokenPlain = newTokens.accessToken
          refreshTokenPlain = newTokens.refreshToken ?? refreshTokenPlain
          await (prisma as any).socialAccount.update({
            where: { id: account.id },
            data: {
              accessToken: encrypt(newTokens.accessToken),
              refreshToken: newTokens.refreshToken
                ? encrypt(newTokens.refreshToken)
                : account.refreshToken,
              tokenExpiresAt: newTokens.expiresAt ?? null,
            },
          })
        } catch {
          // Provider may not support refresh (e.g. Instagram long-lived); publish will fail clearly
        }
      }

      const tokensForPublish = {
        accessToken: accessTokenPlain,
        refreshToken: refreshTokenPlain,
        expiresAt: account.tokenExpiresAt ?? undefined,
      }

      // 6. Preparar URLs públicas (HTTPS) para APIs que puxam a mídia
      const mediaUrls = post.mediaAssets.map((asset: any) =>
        resolveAssetPublicUrl({
          cdnUrl: asset.cdnUrl,
          s3Key: asset.s3Key,
        })
      )
      const mediaMimeTypes = post.mediaAssets.map(
        (asset: any) => asset.mimeType as string
      )

      // 7. Publicar
      const result = await provider.publishPost(tokensForPublish, mediaUrls, {
        title: post.title || undefined,
        caption: post.caption || undefined,
        hashtags: post.hashtags,
        mentions: post.mentions,
        scheduledAt: post.scheduledAt,
        metadata: {
          pageId: account.platformPageId,
          igUserId: account.metadata?.igUserId,
          mediaMimeTypes,
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

      log.info('publish success', {
        scheduledPostId,
        tenantId,
        platform,
        durationMs: Date.now() - t0,
      })
      void createTenantNotification({
        tenantId,
        type: 'publish_success',
        message: `Publicação ${platform} concluída.`,
        metadata: { scheduledPostId, platform, postId: result.postId },
      }).catch(() => {})
      return result
    } catch (error: any) {
      log.error('publish failed', error, {
        scheduledPostId,
        tenantId,
        platform,
        durationMs: Date.now() - t0,
      })
      try {
        const Sentry = await import('@sentry/nextjs')
        Sentry.captureException(error, {
          tags: { worker: 'publishing' },
          extra: { scheduledPostId, tenantId, platform },
        })
      } catch {
        /* opcional */
      }
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

      void createTenantNotification({
        tenantId,
        type: 'publish_failed',
        message: `Falha na publicação ${platform}: ${error.message}`,
        metadata: { scheduledPostId, platform },
      }).catch(() => {})

      throw error
    }
  }

  async close() {
    await this.worker.close()
  }
}

