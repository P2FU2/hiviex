/**
 * Worker BullMQ — executa jobs de flow-execution.
 */

import { Worker, Job } from 'bullmq'
import type { FlowExecutionJobData } from '@/lib/queue/flow-execution-queue'
import { runFlowExecutionJob } from '@/lib/flows/run-flow-execution'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'

export class FlowExecutionWorker {
  private worker: Worker

  constructor(connection: BullMQConnection) {
    this.worker = new Worker<FlowExecutionJobData>(
      'flow-execution',
      async (job: Job<FlowExecutionJobData>) => {
        await runFlowExecutionJob(job.data.executionId)
      },
      {
        connection,
        concurrency: 3,
        removeOnComplete: { count: 200, age: 86400 },
        removeOnFail: { count: 500 },
      }
    )

    this.worker.on('completed', (job) => {
      console.log(`[FlowExecutionWorker] Job ${job.id} completed`)
    })
    this.worker.on('failed', (job, err) => {
      console.error(`[FlowExecutionWorker] Job ${job?.id} failed:`, err)
    })
    this.worker.on('error', (err) => {
      console.error('[FlowExecutionWorker] Error:', err)
    })
  }

  async close(): Promise<void> {
    await this.worker.close()
  }
}
