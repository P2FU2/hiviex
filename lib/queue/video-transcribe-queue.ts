import { Queue } from 'bullmq'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'
import { idempotencyKeyToBullJobId } from '@/lib/queue/bullmq-job-id'

export interface VideoTranscribeJobData {
  tenantId: string
  projectId: string
  sourceId: string
  idempotencyKey: string
}

export class VideoTranscribeQueue {
  private queue: Queue<VideoTranscribeJobData>

  constructor(connection: BullMQConnection) {
    this.queue = new Queue<VideoTranscribeJobData>('video-transcribe', { connection })
  }

  async enqueue(data: VideoTranscribeJobData): Promise<string> {
    const job = await this.queue.add('run', data, {
      jobId: idempotencyKeyToBullJobId(data.idempotencyKey),
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
