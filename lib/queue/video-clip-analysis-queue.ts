import { Queue } from 'bullmq'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'

export interface VideoClipAnalysisJobData {
  tenantId: string
  projectId: string
  /** Se definido, análise focada nesta fonte (MVP: mesmo stub que projeto completo). */
  sourceId: string | null
  idempotencyKey: string
}

export class VideoClipAnalysisQueue {
  private queue: Queue<VideoClipAnalysisJobData>

  constructor(connection: BullMQConnection) {
    this.queue = new Queue<VideoClipAnalysisJobData>('video-clip-analysis', { connection })
  }

  async enqueue(data: VideoClipAnalysisJobData): Promise<string> {
    const job = await this.queue.add('run', data, {
      jobId: data.idempotencyKey,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100, age: 86400 },
      removeOnFail: { count: 200 },
    })
    return job.id!
  }

  async close(): Promise<void> {
    await this.queue.close()
  }
}
