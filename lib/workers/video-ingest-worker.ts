/**
 * Worker BullMQ — video-ingest (MVP: marca fonte e GenerationJob como concluídos).
 */

import { Worker, Job } from 'bullmq'
import type { VideoIngestJobData } from '@/lib/queue/video-ingest-queue'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'
import { createLogger } from '@/lib/observability/logger'
import { prisma } from '@/lib/db/prisma'

const log = createLogger('video-ingest-worker')

export class VideoIngestWorker {
  private worker: Worker

  constructor(connection: BullMQConnection) {
    this.worker = new Worker<VideoIngestJobData>(
      'video-ingest',
      async (job: Job<VideoIngestJobData>) => {
        const { tenantId, projectId, sourceId, idempotencyKey } = job.data

        const genJob = idempotencyKey
          ? await prisma.generationJob.findUnique({
              where: { idempotencyKey },
            })
          : null

        if (genJob?.status === 'PENDING') {
          await prisma.generationJob.update({
            where: { id: genJob.id },
            data: {
              status: 'RUNNING',
              bullJobId: job.id ?? undefined,
            },
          })
        }

        log.info('video ingest stub', { tenantId, projectId, sourceId, idempotencyKey })

        await prisma.videoSource.updateMany({
          where: { id: sourceId, projectId },
          data: { ingestStatus: 'COMPLETED' },
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
                message:
                  'MVP: sem download/transcode real; ingestStatus da fonte = COMPLETED.',
                sourceId,
              },
            },
          })
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

    this.worker.on('completed', (j) => {
      log.info('job completed', { jobId: j.id, ...j.data })
    })
    this.worker.on('failed', (j, err) => {
      log.error('job failed', err, { jobId: j?.id, ...j?.data })
      import('@sentry/nextjs')
        .then((Sentry) =>
          Sentry.captureException(err, {
            tags: { worker: 'video-ingest' },
            extra: { jobId: j?.id, data: j?.data },
          })
        )
        .catch(() => {})
    })
    this.worker.on('error', (err) => {
      log.error('worker error', err)
    })
  }

  async close(): Promise<void> {
    await this.worker.close()
  }
}
