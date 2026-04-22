/**
 * Fila BullMQ — geração de identity pack / preview de influenciador (MVP: enfileirar; worker a seguir).
 */

import { Queue } from 'bullmq'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'

export interface InfluencerGenerationJobData {
  tenantId: string
  influencerId: string
  versionId: string
  jobType: 'INFLUENCER_IDENTITY_PACK' | 'INFLUENCER_PREVIEW'
  idempotencyKey: string
}

export class InfluencerGenerationQueue {
  private queue: Queue<InfluencerGenerationJobData>

  constructor(connection: BullMQConnection) {
    this.queue = new Queue<InfluencerGenerationJobData>(
      'influencer-generation',
      { connection }
    )
  }

  async enqueue(data: InfluencerGenerationJobData): Promise<string> {
    const job = await this.queue.add(
      'run',
      data,
      {
        jobId: data.idempotencyKey,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100, age: 86400 },
        removeOnFail: { count: 200 },
      }
    )
    return job.id!
  }

  async close(): Promise<void> {
    await this.queue.close()
  }
}
