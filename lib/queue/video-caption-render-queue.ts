import { Queue } from 'bullmq'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'

export interface VideoCaptionRenderJobData {
  tenantId: string
  projectId: string
  captionTrackId: string
  sourceMediaAssetId: string
  idempotencyKey: string
}

export class VideoCaptionRenderQueue {
  private queue: Queue<VideoCaptionRenderJobData>

  constructor(connection: BullMQConnection) {
    this.queue = new Queue<VideoCaptionRenderJobData>('video-caption-render', { connection })
  }

  async enqueue(data: VideoCaptionRenderJobData): Promise<string> {
    const job = await this.queue.add('run', data, {
      jobId: data.idempotencyKey,
      attempts: 2,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { count: 60, age: 86400 },
      removeOnFail: { count: 120 },
    })
    return job.id!
  }

  async close(): Promise<void> {
    await this.queue.close()
  }
}
