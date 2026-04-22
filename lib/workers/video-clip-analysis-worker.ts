import { Worker, Job } from 'bullmq'
import type { VideoClipAnalysisJobData } from '@/lib/queue/video-clip-analysis-queue'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'
import { createLogger } from '@/lib/observability/logger'
import { prisma } from '@/lib/db/prisma'

const log = createLogger('video-clip-analysis-worker')

export class VideoClipAnalysisWorker {
  private worker: Worker

  constructor(connection: BullMQConnection) {
    this.worker = new Worker<VideoClipAnalysisJobData>(
      'video-clip-analysis',
      async (job: Job<VideoClipAnalysisJobData>) => {
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

        log.info('video clip analysis stub', { tenantId, projectId, sourceId })

        /** Idempotência MVP: remove candidatos stub anteriores ainda PENDING antes de gerar de novo. */
        await prisma.$executeRaw`
          DELETE FROM video_clip_candidates
          WHERE "projectId" = ${projectId}
            AND status::text = 'PENDING'
            AND (reasoning->>'stub') = 'true'
        `

        const maxRank = await prisma.videoClipCandidate.aggregate({
          where: { projectId },
          _max: { rank: true },
        })
        let rank = (maxRank._max.rank ?? 0) + 1

        const createdIds: string[] = []
        const stubWindows = [
          { startMs: 0, endMs: 12_000, durationTarget: 12_000, score: 0.72 },
          { startMs: 12_000, endMs: 28_000, durationTarget: 16_000, score: 0.65 },
        ]

        for (const w of stubWindows) {
          const row = await prisma.videoClipCandidate.create({
            data: {
              projectId,
              rank: rank++,
              startMs: w.startMs,
              endMs: w.endMs,
              durationTarget: w.durationTarget,
              score: w.score,
              status: 'PENDING',
              reasoning: {
                stub: true,
                sourceId,
                note: 'MVP: candidatos simulados; substituir por análise real.',
              } as object,
            },
          })
          createdIds.push(row.id)
        }

        await prisma.videoProject.updateMany({
          where: { id: projectId },
          data: { status: 'READY_FOR_EDIT' },
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
              outputRef: { clipCandidateIds: createdIds, sourceId },
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

    this.worker.on('completed', (j) => log.info('job completed', { jobId: j.id, ...j.data }))
    this.worker.on('failed', (j, err) => {
      log.error('job failed', err, { jobId: j?.id, ...j?.data })
      import('@sentry/nextjs')
        .then((Sentry) =>
          Sentry.captureException(err, {
            tags: { worker: 'video-clip-analysis' },
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
