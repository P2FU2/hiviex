/**
 * Render de clip: descarrega fonte do projeto → ffmpeg → S3 → MediaAsset + preview no candidato.
 */

import { readFile } from 'fs/promises'
import path from 'path'
import { Worker, Job } from 'bullmq'
import type { VideoClipRenderJobData } from '@/lib/queue/video-clip-render-queue'
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
import { downloadProjectSourceToTempFile } from '@/lib/video/download-project-source-to-file'
import { extractClipToMp4 } from '@/lib/video/ffmpeg-extract-clip'

const log = createLogger('video-clip-render-worker')

export class VideoClipRenderWorker {
  private worker: Worker

  constructor(connection: BullMQConnection) {
    this.worker = new Worker<VideoClipRenderJobData>(
      'video-clip-render',
      async (job: Job<VideoClipRenderJobData>) => {
        const { tenantId, projectId, candidateId, idempotencyKey } = job.data

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
            throw new Error(
              'S3/R2 não configurado — necessário para gravar o clip renderizado.'
            )
          }

          const candidate = await prisma.videoClipCandidate.findFirst({
            where: { id: candidateId, projectId },
          })
          if (!candidate) {
            throw new Error('Candidato não encontrado.')
          }
          if (candidate.status !== 'APPROVED') {
            throw new Error('Só candidatos APPROVED podem ser renderizados.')
          }

          const cfg = readObjectStorageConfig()!
          let temp: Awaited<ReturnType<typeof downloadProjectSourceToTempFile>> | null =
            null

          try {
            temp = await downloadProjectSourceToTempFile(projectId)
            const outPath = path.join(temp.dir, 'out.mp4')

            log.info('ffmpeg extract', {
              projectId,
              candidateId,
              startMs: candidate.startMs,
              endMs: candidate.endMs,
            })
            await extractClipToMp4(
              temp.inputPath,
              outPath,
              candidate.startMs,
              candidate.endMs
            )

            const outBuf = await readFile(outPath)
            if (outBuf.length === 0) {
              throw new Error('ffmpeg produziu ficheiro vazio.')
            }

            const fileName = `clip-r${candidate.rank}-${candidateId.slice(0, 8)}.mp4`
            const s3Key = buildTenantMediaKey(tenantId, fileName)
            await putObjectBuffer(s3Key, outBuf, 'video/mp4')

            const cdnUrl = publicUrlForStorageKey(s3Key, cfg)
            const durationSec = Math.max(
              1,
              Math.round((candidate.endMs - candidate.startMs) / 1000)
            )

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
                duration: durationSec,
                metadata: {
                  source: 'clip-render',
                  candidateId,
                  projectId,
                  startMs: candidate.startMs,
                  endMs: candidate.endMs,
                } as object,
              },
            })

            await prisma.videoClipCandidate.update({
              where: { id: candidateId },
              data: {
                status: 'RENDERED',
                previewMediaAssetId: asset.id,
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
                    candidateId,
                    previewMediaAssetId: asset.id,
                    s3Key,
                    cdnUrl,
                    bytes: outBuf.length,
                  },
                },
              })
            }

            log.info('clip render ok', {
              candidateId,
              assetId: asset.id,
              bytes: outBuf.length,
            })
          } finally {
            if (temp) {
              await temp.dispose()
            }
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
        removeOnComplete: { count: 80, age: 86400 },
        removeOnFail: { count: 150 },
        maxStalledCount: 2,
      }
    )

    this.worker.on('completed', (j) => log.info('job completed', { jobId: j.id, ...j.data }))
    this.worker.on('failed', (j, err) => {
      log.error('job failed', err, { jobId: j?.id, ...j?.data })
      import('@sentry/nextjs')
        .then((Sentry) =>
          Sentry.captureException(err, {
            tags: { worker: 'video-clip-render' },
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
