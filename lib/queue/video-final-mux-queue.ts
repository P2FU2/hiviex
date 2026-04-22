import { Queue } from 'bullmq'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'

export interface VideoFinalMuxJobData {
  tenantId: string
  projectId: string
  videoMediaAssetId: string
  audioMediaAssetId: string | null
  audioUrl: string | null
  idempotencyKey: string
}

export class VideoFinalMuxQueue {
  private queue: Queue<VideoFinalMuxJobData>

  constructor(connection: BullMQConnection) {
    this.queue = new Queue<VideoFinalMuxJobData>('video-final-mux', { connection })
  }

  async enqueue(data: VideoFinalMuxJobData): Promise<string> {
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
