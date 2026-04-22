/**
 * Worker BullMQ — job repetível que corre tickScheduledFlows (flows SCHEDULED).
 */

import { Queue, Worker, Job } from 'bullmq'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'
import { tickScheduledFlows } from '@/lib/scheduled/flow-scheduler'
import { createLogger } from '@/lib/observability/logger'

const log = createLogger('flow-scheduled-tick')

export class FlowScheduledTickWorker {
  private worker: Worker
  private queue: Queue

  constructor(connection: BullMQConnection) {
    this.queue = new Queue('flow-scheduled-tick', { connection })

    this.worker = new Worker(
      'flow-scheduled-tick',
      async (_job: Job) => {
        await tickScheduledFlows()
      },
      {
        connection,
        concurrency: 1,
        removeOnComplete: { count: 50, age: 86400 },
        removeOnFail: { count: 100 },
      }
    )

    void this.ensureRepeatableJob()

    this.worker.on('completed', () => {
      log.debug('tick completed')
    })
    this.worker.on('failed', (job, err) => {
      log.error('tick job failed', err, { jobId: job?.id })
    })
    this.worker.on('error', (err) => {
      log.error('worker error', err)
    })
  }

  private async ensureRepeatableJob(): Promise<void> {
    try {
      await this.queue.add(
        'tick',
        {},
        {
          jobId: 'flow-scheduled-repeat',
          repeat: { every: 60_000 },
        }
      )
    } catch (e) {
      log.warn('repeat job may already exist', {
        err: e instanceof Error ? e.message : String(e),
      })
    }
  }

  async close(): Promise<void> {
    await this.worker.close()
    await this.queue.close()
  }
}
