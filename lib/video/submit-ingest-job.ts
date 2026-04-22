/**
 * Cria GenerationJob e enfileira video-ingest.
 * Quota: por omissão reserva aqui; use quotaAlreadyReserved após reserva + VideoSource no caller.
 */

import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { getBullMQConnection } from '@/lib/redis/bullmq-connection'
import { VideoIngestQueue } from '@/lib/queue/video-ingest-queue'
import {
  tryReserveMonthlyUsage,
  releaseMonthlyUsage,
  appendUsageAuditLog,
} from '@/lib/billing/usage'

export async function submitVideoIngestJob(input: {
  tenantId: string
  projectId: string
  sourceId: string
  /** Quando true, não reserva nem liberta quota (caller já reservou antes de criar a fonte). */
  quotaAlreadyReserved?: boolean
}): Promise<
  | { ok: true; generationJobId: string; idempotencyKey: string; bullJobId: string }
  | { ok: false; error: 'QUOTA' | 'ENQUEUE_FAILED'; message?: string }
> {
  const { tenantId, projectId, sourceId, quotaAlreadyReserved } = input

  if (!quotaAlreadyReserved) {
    const reserved = await tryReserveMonthlyUsage(tenantId, 1, 'video_ingest')
    if (!reserved) {
      return { ok: false, error: 'QUOTA' }
    }
  }

  const idempotencyKey = `vid-ingest:${sourceId}:${randomUUID()}`

  const genJob = await prisma.generationJob.create({
    data: {
      tenantId,
      projectId,
      type: 'VIDEO_INGEST',
      status: 'PENDING',
      idempotencyKey,
      reservedUnits: 1,
      inputRef: { projectId, sourceId } as object,
    },
  })

  const connection = getBullMQConnection()
  const queue = new VideoIngestQueue(connection)

  try {
    const bullJobId = await queue.enqueue({
      tenantId,
      projectId,
      sourceId,
      idempotencyKey,
    })
    await prisma.generationJob.update({
      where: { id: genJob.id },
      data: { bullJobId },
    })
    await appendUsageAuditLog(tenantId, { feature: 'video_ingest', amount: 1 })
    await queue.close()
    return { ok: true, generationJobId: genJob.id, idempotencyKey, bullJobId }
  } catch (e) {
    console.error('submitVideoIngestJob enqueue', e)
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
