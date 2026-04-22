/**
 * Fila BullMQ para execução de fluxos (sobrevive a serverless / timeout da request).
 */

import { Queue } from 'bullmq'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'

export interface FlowExecutionJobData {
  executionId: string
  tenantId: string
}

export class FlowExecutionQueue {
  private queue: Queue<FlowExecutionJobData>

  constructor(connection: BullMQConnection) {
    this.queue = new Queue<FlowExecutionJobData>('flow-execution', { connection })
  }

  async enqueue(data: FlowExecutionJobData): Promise<string> {
    const job = await this.queue.add(
      'run',
      data,
      {
        jobId: `flow-exec-${data.executionId}`,
        attempts: 4,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 200, age: 86400 },
        removeOnFail: { count: 500 },
      }
    )
    return job.id!
  }

  async close(): Promise<void> {
    await this.queue.close()
  }
}
