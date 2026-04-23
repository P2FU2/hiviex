import { Queue } from 'bullmq'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'
import { idempotencyKeyToBullJobId } from '@/lib/queue/bullmq-job-id'

export interface VideoClipRenderJobData {
  tenantId: string
  projectId: string
  candidateId: string
  idempotencyKey: string
}

export class VideoClipRenderQueue {
  private queue: Queue<VideoClipRenderJobData>

  constructor(connection: BullMQConnection) {
    this.queue = new Queue<VideoClipRenderJobData>('video-clip-render', { connection })
  }

  async enqueue(data: VideoClipRenderJobData): Promise<string> {
    const job = await this.queue.add('run', data, {
      jobId: idempotencyKeyToBullJobId(data.idempotencyKey),
      attempts: 2,
      backoff: { type: 'exponential', delay: 8000 },
      removeOnComplete: { count: 80, age: 86400 },
      removeOnFail: { count: 150 },
    })
    return job.id!
  }

  async close(): Promise<void> {
    await this.queue.close()
  }
}
