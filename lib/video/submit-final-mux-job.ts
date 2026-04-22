import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { getBullMQConnection } from '@/lib/redis/bullmq-connection'
import { VideoFinalMuxQueue } from '@/lib/queue/video-final-mux-queue'
import {
  tryReserveMonthlyUsage,
  releaseMonthlyUsage,
  appendUsageAuditLog,
} from '@/lib/billing/usage'

export async function submitFinalMuxJob(input: {
  tenantId: string
  projectId: string
  videoMediaAssetId: string
  audioMediaAssetId?: string | null
  audioUrl?: string | null
  quotaAlreadyReserved?: boolean
}): Promise<
  | { ok: true; generationJobId: string; idempotencyKey: string; bullJobId: string }
  | { ok: false; error: 'QUOTA' | 'ENQUEUE_FAILED'; message?: string }
> {
  const {
    tenantId,
    projectId,
    videoMediaAssetId,
    audioMediaAssetId,
    audioUrl,
    quotaAlreadyReserved,
  } = input

  if (!quotaAlreadyReserved) {
    const reserved = await tryReserveMonthlyUsage(tenantId, 1, 'video_render')
    if (!reserved) {
      return { ok: false, error: 'QUOTA' }
    }
  }

  const idempotencyKey = `final-mux:${projectId}:${randomUUID()}`

  const genJob = await prisma.generationJob.create({
    data: {
      tenantId,
      projectId,
      type: 'VIDEO_FINAL_MUX',
      status: 'PENDING',
      idempotencyKey,
      reservedUnits: 1,
      inputRef: {
        videoMediaAssetId,
        audioMediaAssetId: audioMediaAssetId ?? null,
        audioUrl: audioUrl ?? null,
      } as object,
    },
  })

  const connection = getBullMQConnection()
  const queue = new VideoFinalMuxQueue(connection)

  try {
    const bullJobId = await queue.enqueue({
      tenantId,
      projectId,
      videoMediaAssetId,
      audioMediaAssetId: audioMediaAssetId ?? null,
      audioUrl: audioUrl ?? null,
      idempotencyKey,
    })
    await prisma.generationJob.update({
      where: { id: genJob.id },
      data: { bullJobId },
    })
    await appendUsageAuditLog(tenantId, { feature: 'video_render', amount: 1 })
    await queue.close()
    return { ok: true, generationJobId: genJob.id, idempotencyKey, bullJobId }
  } catch (e) {
    console.error('submitFinalMuxJob enqueue', e)
    await prisma.generationJob.update({
      where: { id: genJob.id },
      data: {
        status: 'FAILED',
        error: e instanceof Error ? e.message : 'enqueue failed',
      },
    })
    if (!quotaAlreadyReserved) {
      await releaseMonthlyUsage(tenantId, 1)
    }
    await queue.close().catch(() => {})
    return {
      ok: false,
      error: 'ENQUEUE_FAILED',
      message: e instanceof Error ? e.message : undefined,
    }
  }
}
