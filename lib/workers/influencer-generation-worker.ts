/**
 * Worker BullMQ — influencer-generation (LLM real se houver chave; senão completa com aviso).
 */

import { Worker, Job } from 'bullmq'
import type { InfluencerGenerationJobData } from '@/lib/queue/influencer-generation-queue'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'
import { createLogger } from '@/lib/observability/logger'
import { prisma } from '@/lib/db/prisma'
import { runInfluencerGeneration } from '@/lib/influencers/run-influencer-generation'

const log = createLogger('influencer-generation-worker')

export class InfluencerGenerationWorker {
  private worker: Worker

  constructor(connection: BullMQConnection) {
    this.worker = new Worker<InfluencerGenerationJobData>(
      'influencer-generation',
      async (job: Job<InfluencerGenerationJobData>) => {
        const { tenantId, influencerId, versionId, jobType, idempotencyKey } = job.data

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

        try {
          const result = await runInfluencerGeneration(job.data)
          log.info('influencer generation done', {
            tenantId,
            influencerId,
            versionId,
            jobType,
            usedLlm: result.usedLlm,
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
                  ...result.outputRef,
                  usedLlm: result.usedLlm,
                } as object,
              },
            })
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          log.error('influencer generation failed', err, {
            tenantId,
            influencerId,
            versionId,
            jobType,
          })
          if (genJob?.id) {
            await prisma.generationJob.update({
              where: { id: genJob.id },
              data: {
                status: 'FAILED',
                error: message,
              },
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

    this.worker.on('completed', (j) => {
      log.info('job completed', { jobId: j.id, ...j.data })
    })
    this.worker.on('failed', (j, err) => {
      log.error('job failed', err, { jobId: j?.id, ...j?.data })
      import('@sentry/nextjs')
        .then((Sentry) =>
          Sentry.captureException(err, {
            tags: { worker: 'influencer-generation' },
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
