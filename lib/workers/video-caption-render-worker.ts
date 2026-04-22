/**
 * Queima legendas (SRT) num vídeo e grava novo MediaAsset.
 */

import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import path from 'path'
import { tmpdir } from 'os'
import { Worker, Job } from 'bullmq'
import type { VideoCaptionRenderJobData } from '@/lib/queue/video-caption-render-queue'
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
import { burnSubtitlesToMp4 } from '@/lib/video/ffmpeg-extract-clip'
import { copyMediaAssetIntoDir, extFromMime } from '@/lib/video/copy-media-asset-to-dir'
import { normalizeCaptionSegments, segmentsToSrt } from '@/lib/video/srt-from-segments'

const log = createLogger('video-caption-render-worker')

export class VideoCaptionRenderWorker {
  private worker: Worker

  constructor(connection: BullMQConnection) {
    this.worker = new Worker<VideoCaptionRenderJobData>(
      'video-caption-render',
      async (job: Job<VideoCaptionRenderJobData>) => {
        const { tenantId, projectId, captionTrackId, sourceMediaAssetId, idempotencyKey } =
          job.data

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

          const track = await prisma.captionTrack.findFirst({
            where: { id: captionTrackId, projectId },
          })
          if (!track) {
            throw new Error('Faixa de legendas não encontrada.')
          }

          const videoMeta = await prisma.mediaAsset.findFirst({
            where: { id: sourceMediaAssetId, tenantId },
            select: { mimeType: true },
          })
          if (!videoMeta) {
            throw new Error('Vídeo de origem inválido.')
          }

          const segments = normalizeCaptionSegments(track.segments)
          const srt = segmentsToSrt(segments)

          const dir = await mkdtemp(path.join(tmpdir(), 'hiviex-cap-'))
          try {
            const vName = `vin${extFromMime(videoMeta.mimeType)}`
            await copyMediaAssetIntoDir({
              tenantId,
              mediaAssetId: sourceMediaAssetId,
              dir,
              fileName: vName,
            })
            await writeFile(path.join(dir, 'subs.srt'), srt, 'utf8')

            await burnSubtitlesToMp4({
              workDir: dir,
              inputFile: vName,
              srtFile: 'subs.srt',
              outputFile: 'captioned.mp4',
            })

            const outBuf = await readFile(path.join(dir, 'captioned.mp4'))
            const cfg = readObjectStorageConfig()!
            const fileName = `captioned-${captionTrackId.slice(0, 8)}.mp4`
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
                  source: 'caption-render',
                  captionTrackId,
                  projectId,
                  sourceMediaAssetId,
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
                config: {
                  ...prev,
                  lastCaptionMediaAssetId: asset.id,
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
                    outputMediaAssetId: asset.id,
                    s3Key,
                    cdnUrl,
                    bytes: outBuf.length,
                  },
                },
              })
            }

            log.info('caption render ok', { captionTrackId, assetId: asset.id })
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
            tags: { worker: 'video-caption-render' },
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
