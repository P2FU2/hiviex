/**
 * Worker BullMQ — executa jobs de flow-execution.
 */

import { Worker, Job } from 'bullmq'
import type { FlowExecutionJobData } from '@/lib/queue/flow-execution-queue'
import { runFlowExecutionJob } from '@/lib/flows/run-flow-execution'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'
import { createLogger } from '@/lib/observability/logger'

const log = createLogger('flow-execution-worker')

export class FlowExecutionWorker {
  private worker: Worker

  constructor(connection: BullMQConnection) {
    this.worker = new Worker<FlowExecutionJobData>(
      'flow-execution',
      async (job: Job<FlowExecutionJobData>) => {
        await runFlowExecutionJob(job.data.executionId, job.data.tenantId)
      },
      {
        connection,
        concurrency: 3,
        removeOnComplete: { count: 200, age: 86400 },
        removeOnFail: { count: 500 },
        maxStalledCount: 2,
      }
    )

    this.worker.on('completed', (job) => {
      log.info('job completed', {
        jobId: job.id,
        executionId: job.data?.executionId,
        tenantId: job.data?.tenantId,
      })
    })
    this.worker.on('failed', (job, err) => {
      log.error('job failed', err, {
        jobId: job?.id,
        executionId: job?.data?.executionId,
        tenantId: job?.data?.tenantId,
      })
      import('@sentry/nextjs')
        .then((Sentry) =>
          Sentry.captureException(err, {
            tags: { worker: 'flow-execution' },
            extra: {
              jobId: job?.id,
              executionId: job?.data?.executionId,
              tenantId: job?.data?.tenantId,
            },
          })
        )
        .catch(() => {})
    })
    this.worker.on('error', (err) => {
      log.error('worker error', err)
    })
  }

  async close(): Promise<void> {
    await this.worker.close()
  }
}
