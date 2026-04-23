/**
 * Fila BullMQ — ingestão de fonte de vídeo (MVP: stub no worker).
 */

import { Queue } from 'bullmq'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'
import { idempotencyKeyToBullJobId } from '@/lib/queue/bullmq-job-id'

export interface VideoIngestJobData {
  tenantId: string
  projectId: string
  sourceId: string
  idempotencyKey: string
}

export class VideoIngestQueue {
  private queue: Queue<VideoIngestJobData>

  constructor(connection: BullMQConnection) {
    this.queue = new Queue<VideoIngestJobData>('video-ingest', { connection })
  }

  async enqueue(data: VideoIngestJobData): Promise<string> {
    const job = await this.queue.add(
      'run',
      data,
      {
        jobId: idempotencyKeyToBullJobId(data.idempotencyKey),
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
