/**
 * Transcrição — Whisper (OpenAI) quando há áudio + chave; senão stub.
 */

import { Worker, Job } from 'bullmq'
import type { VideoTranscribeJobData } from '@/lib/queue/video-transcribe-queue'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'
import { createLogger } from '@/lib/observability/logger'
import { prisma } from '@/lib/db/prisma'
import { getDecryptedWorkspaceApiSecret } from '@/lib/services/workspace-api-secrets'
import {
  getObjectBufferLimited,
  isObjectStorageConfigured,
} from '@/lib/storage/object-storage'
import { fetchUrlBufferLimited } from '@/lib/video/fetch-media-buffer'
import { transcribeWithOpenAIWhisper } from '@/lib/video/whisper-transcribe'

const log = createLogger('video-transcribe-worker')

const DEFAULT_MAX = 25 * 1024 * 1024

function maxBytes(): number {
  const raw = process.env.TRANSCRIBE_MAX_BYTES?.trim()
  if (raw && /^\d+$/.test(raw)) {
    const n = parseInt(raw, 10)
    if (n > 0) return n
  }
  return DEFAULT_MAX
}

export class VideoTranscribeWorker {
  private worker: Worker

  constructor(connection: BullMQConnection) {
    this.worker = new Worker<VideoTranscribeJobData>(
      'video-transcribe',
      async (job: Job<VideoTranscribeJobData>) => {
        const { tenantId, projectId, sourceId, idempotencyKey } = job.data

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
          const source = await prisma.videoSource.findFirst({
            where: { id: sourceId, projectId },
            include: { mediaAsset: true },
          })
          if (!source) {
            throw new Error('Fonte não encontrada.')
          }

          const apiKey =
            (await getDecryptedWorkspaceApiSecret(tenantId, 'openai')) ||
            process.env.OPENAI_API_KEY?.trim() ||
            null

          const limit = maxBytes()
          let buffer: Buffer | null = null
          let fileName = 'media.mp4'
          let mimeType = 'video/mp4'

          if (source.mediaAsset) {
            fileName = source.mediaAsset.fileName || fileName
            mimeType = source.mediaAsset.mimeType || mimeType
            if (isObjectStorageConfigured()) {
              buffer = await getObjectBufferLimited(source.mediaAsset.s3Key, limit)
            } else if (
              source.mediaAsset.cdnUrl &&
              /^https:\/\//i.test(source.mediaAsset.cdnUrl.trim())
            ) {
              buffer = await fetchUrlBufferLimited(source.mediaAsset.cdnUrl.trim(), limit)
            }
          } else if (source.sourceUrl && /^https:\/\//i.test(source.sourceUrl.trim())) {
            buffer = await fetchUrlBufferLimited(source.sourceUrl.trim(), limit)
            fileName = 'remote-source.mp4'
          }

          let transcript: Record<string, unknown>

          if (buffer && apiKey) {
            const out = await transcribeWithOpenAIWhisper({
              apiKey,
              buffer,
              fileName,
              mimeType,
            })
            transcript = {
              stub: false,
              provider: 'openai-whisper',
              text: out.text,
              language: out.language,
              durationSec: out.durationSec,
            }
            log.info('whisper ok', { sourceId, chars: out.text.length })
          } else {
            log.info('transcribe stub (sem áudio ou sem chave)', {
              sourceId,
              hasBuffer: !!buffer,
              hasKey: !!apiKey,
            })
            transcript = {
              stub: true,
              language: 'pt',
              text: 'MVP: sem ficheiro/chave — configure OPENAI_API_KEY e fonte com vídeo/áudio.',
              segments: [],
            }
          }

          await prisma.videoSource.updateMany({
            where: { id: sourceId, projectId },
            data: { transcript: transcript as object },
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
                  sourceId,
                  transcriptPreview:
                    typeof transcript.text === 'string'
                      ? transcript.text.slice(0, 500)
                      : '',
                  usedWhisper: transcript.stub !== true,
                },
              },
            })
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
        concurrency: 2,
        removeOnComplete: { count: 100, age: 86400 },
        removeOnFail: { count: 200 },
        maxStalledCount: 2,
      }
    )

    this.worker.on('completed', (j) => log.info('job completed', { jobId: j.id, ...j.data }))
    this.worker.on('failed', (j, err) => {
      log.error('job failed', err, { jobId: j?.id, ...j?.data })
      import('@sentry/nextjs')
        .then((Sentry) =>
          Sentry.captureException(err, {
            tags: { worker: 'video-transcribe' },
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
