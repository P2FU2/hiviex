/**
 * Mux final: vídeo + áudio opcional (MediaAsset ou URL HTTPS) → MP4 entregue + projeto COMPLETED.
 */

import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import path from 'path'
import { tmpdir } from 'os'
import { Worker, Job } from 'bullmq'
import type { VideoFinalMuxJobData } from '@/lib/queue/video-final-mux-queue'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'
import { createLogger } from '@/lib/observability/logger'
import { prisma } from '@/lib/db/prisma'
import {
  buildTenantMediaKey,
  isObjectStorageConfigured,
  publicUrlForStorageKey,
  putObjectBuffer,
  readObjectStorageConfig,
} from '@/lib/storage/object-storage'
import { muxFinalMp4 } from '@/lib/video/ffmpeg-extract-clip'
import {
  copyMediaAssetIntoDir,
  extFromMime,
  renderMaxInputBytes,
} from '@/lib/video/copy-media-asset-to-dir'
import { fetchUrlBufferLimited } from '@/lib/video/fetch-media-buffer'
import { isBlockedOutboundUrl } from '@/lib/security/ssrf'

const log = createLogger('video-final-mux-worker')

export class VideoFinalMuxWorker {
  private worker: Worker

  constructor(connection: BullMQConnection) {
    this.worker = new Worker<VideoFinalMuxJobData>(
      'video-final-mux',
      async (job: Job<VideoFinalMuxJobData>) => {
        const {
          tenantId,
          projectId,
          videoMediaAssetId,
          audioMediaAssetId,
          audioUrl,
          idempotencyKey,
        } = job.data

        const genJob = idempotencyKey
          ? await prisma.generationJob.findUnique({ where: { idempotencyKey } })
          : null

        if (genJob?.status === 'PENDING') {
          await prisma.generationJob.update({
            where: { id: genJob.id },
            data: { status: 'RUNNING', bullJobId: job.id ?? undefined },
          })
        }

        try {
          if (!isObjectStorageConfigured()) {
            throw new Error('S3/R2 não configurado.')
          }

          const videoMeta = await prisma.mediaAsset.findFirst({
            where: { id: videoMediaAssetId, tenantId },
            select: { mimeType: true },
          })
          if (!videoMeta) {
            throw new Error('Vídeo inválido.')
          }

          const dir = await mkdtemp(path.join(tmpdir(), 'hiviex-mux-'))
          try {
            const vName = `v${extFromMime(videoMeta.mimeType)}`
            await copyMediaAssetIntoDir({
              tenantId,
              mediaAssetId: videoMediaAssetId,
              dir,
              fileName: vName,
            })

            let audioName: string | null = null
            if (audioMediaAssetId) {
              const aMeta = await prisma.mediaAsset.findFirst({
                where: { id: audioMediaAssetId, tenantId },
                select: { mimeType: true },
              })
              if (!aMeta) {
                throw new Error('Áudio (MediaAsset) inválido.')
              }
              audioName = `a${extFromMime(aMeta.mimeType)}`
              await copyMediaAssetIntoDir({
                tenantId,
                mediaAssetId: audioMediaAssetId,
                dir,
                fileName: audioName,
              })
            } else if (audioUrl?.trim()) {
              const u = audioUrl.trim()
              if (isBlockedOutboundUrl(u) || !/^https:\/\//i.test(u)) {
                throw new Error('URL de áudio bloqueada ou inválida.')
              }
              const buf = await fetchUrlBufferLimited(u, renderMaxInputBytes())
              audioName = 'remote-audio.mp3'
              await writeFile(path.join(dir, audioName), buf)
            }

            await muxFinalMp4(dir, vName, audioName, 'final.mp4')

            const outBuf = await readFile(path.join(dir, 'final.mp4'))
            const cfg = readObjectStorageConfig()!
            const fileName = `final-${projectId.slice(0, 8)}.mp4`
            const s3Key = buildTenantMediaKey(tenantId, fileName)
            await putObjectBuffer(s3Key, outBuf, 'video/mp4')
            const cdnUrl = publicUrlForStorageKey(s3Key, cfg)

            const asset = await prisma.mediaAsset.create({
              data: {
                tenantId,
                fileName,
                fileSize: outBuf.length,
                mimeType: 'video/mp4',
                mediaType: 'VIDEO',
                s3Key,
                s3Bucket: cfg.bucket,
                cdnUrl,
                processed: true,
                metadata: {
                  source: 'final-mux',
                  projectId,
                  videoMediaAssetId,
                  audioMediaAssetId: audioMediaAssetId ?? null,
                  hadAudioUrl: !!audioUrl,
                } as object,
              },
            })

            const proj = await prisma.videoProject.findUnique({
              where: { id: projectId },
              select: { config: true },
            })
            const prev = (proj?.config as Record<string, unknown>) || {}

            await prisma.videoProject.update({
              where: { id: projectId },
              data: {
                status: 'COMPLETED',
                config: {
                  ...prev,
                  finalMediaAssetId: asset.id,
                } as object,
              },
            })

            if (
              genJob &&
              genJob.status !== 'COMPLETED' &&
              genJob.status !== 'CANCELLED'
            ) {
              await prisma.generationJob.update({
                where: { id: genJob.id },
                data: {
                  status: 'COMPLETED',
                  outputRef: {
                    finalMediaAssetId: asset.id,
                    s3Key,
                    cdnUrl,
                    bytes: outBuf.length,
                  },
                },
              })
            }

            log.info('final mux ok', { projectId, assetId: asset.id })
          } finally {
            await rm(dir, { recursive: true, force: true }).catch(() => {})
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          if (genJob?.id) {
            await prisma.generationJob.update({
              where: { id: genJob.id },
              data: { status: 'FAILED', error: message },
            })
          }
          await prisma.videoProject.updateMany({
            where: { id: projectId, tenantId },
            data: { status: 'FAILED' },
          })
          throw err
        }
      },
      {
        connection,
        concurrency: 1,
        removeOnComplete: { count: 60, age: 86400 },
        removeOnFail: { count: 120 },
        maxStalledCount: 2,
      }
    )

    this.worker.on('completed', (j) => log.info('job completed', { jobId: j.id, ...j.data }))
    this.worker.on('failed', (j, err) => {
      log.error('job failed', err, { jobId: j?.id, ...j?.data })
      import('@sentry/nextjs')
        .then((Sentry) =>
          Sentry.captureException(err, {
            tags: { worker: 'video-final-mux' },
            extra: { jobId: j?.id, data: j?.data },
          })
        )
        .catch(() => {})
    })
    this.worker.on('error', (err) => log.error('worker error', err))
  }

  async close(): Promise<void> {
    await this.worker.close()
  }
}
