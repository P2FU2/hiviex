/**
 * Reserva quota, cria GenerationJob e enfileira influencer-generation.
 */

import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { getBullMQConnection } from '@/lib/redis/bullmq-connection'
import { InfluencerGenerationQueue } from '@/lib/queue/influencer-generation-queue'
import {
  tryReserveMonthlyUsage,
  releaseMonthlyUsage,
  appendUsageAuditLog,
  type UsageFeature,
} from '@/lib/billing/usage'
import type { GenerationJobType } from '@prisma/client'

const JOB_TO_FEATURE: Record<
  'INFLUENCER_IDENTITY_PACK' | 'INFLUENCER_PREVIEW',
  UsageFeature
> = {
  INFLUENCER_IDENTITY_PACK: 'influencer_identity_pack',
  INFLUENCER_PREVIEW: 'influencer_preview',
}

export type InfluencerQueueJobType = keyof typeof JOB_TO_FEATURE

export async function submitInfluencerGenerationJob(input: {
  tenantId: string
  influencerId: string
  versionId: string
  jobType: InfluencerQueueJobType
}): Promise<
  | { ok: true; generationJobId: string; idempotencyKey: string; bullJobId: string }
  | { ok: false; error: 'QUOTA' | 'ENQUEUE_FAILED'; message?: string }
> {
  const { tenantId, influencerId, versionId, jobType } = input
  const dbType = jobType as GenerationJobType
  const feature = JOB_TO_FEATURE[jobType]

  const reserved = await tryReserveMonthlyUsage(tenantId, 1, feature)
  if (!reserved) {
    return { ok: false, error: 'QUOTA' }
  }

  const idempotencyKey = `inf-gen:${versionId}:${jobType}:${randomUUID()}`

  const genJob = await prisma.generationJob.create({
    data: {
      tenantId,
      type: dbType,
      status: 'PENDING',
      idempotencyKey,
      reservedUnits: 1,
      inputRef: {
        influencerId,
        versionId,
        jobType,
      } as object,
    },
  })

  const connection = getBullMQConnection()
  const queue = new InfluencerGenerationQueue(connection)

  try {
    const bullJobId = await queue.enqueue({
      tenantId,
      influencerId,
      versionId,
      jobType,
      idempotencyKey,
    })
    await prisma.generationJob.update({
      where: { id: genJob.id },
      data: { bullJobId },
    })
    await appendUsageAuditLog(tenantId, { feature, amount: 1 })
    await queue.close()
    return { ok: true, generationJobId: genJob.id, idempotencyKey, bullJobId }
  } catch (e) {
    console.error('submitInfluencerGenerationJob enqueue', e)
    await prisma.generationJob.update({
      where: { id: genJob.id },
      data: {
        status: 'FAILED',
        error: e instanceof Error ? e.message : 'enqueue failed',
      },
    })
    await releaseMonthlyUsage(tenantId, 1)
    await queue.close().catch(() => {})
    return {
      ok: false,
      error: 'ENQUEUE_FAILED',
      message: e instanceof Error ? e.message : undefined,
    }
  }
}
