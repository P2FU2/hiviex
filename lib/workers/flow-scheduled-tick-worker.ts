/**
 * Worker BullMQ — job repetível: recupera RUNNING presos + flows SCHEDULED.
 * Lock Redis evita trabalho duplicado com várias réplicas de worker.
 */

import { Worker, Job } from 'bullmq'
import type { BullMQConnection } from '@/lib/redis/bullmq-connection'
import { tickScheduledFlows } from '@/lib/scheduled/flow-scheduler'
import { recoverStuckFlowExecutions } from '@/lib/scheduled/recover-flow-executions'
import { createLogger } from '@/lib/observability/logger'
import { getWorkerRedis } from '@/lib/redis/worker-redis'

const log = createLogger('flow-scheduled-tick')

const LOCK_KEY = 'hiviex:scheduler:tick-lock'
const LOCK_TTL_SEC = 90

export class FlowScheduledTickWorker {
  private worker: Worker

  constructor(connection: BullMQConnection) {
    this.worker = new Worker(
      'flow-scheduled-tick',
      async (_job: Job) => {
        const redis = getWorkerRedis()
        const got = await redis.set(LOCK_KEY, '1', 'EX', LOCK_TTL_SEC, 'NX')
        if (!got) {
          log.debug('scheduler tick skipped — lock held by another process')
          return
        }
        try {
          const recovered = await recoverStuckFlowExecutions()
          if (recovered > 0) {
            log.info('recovered stuck flow executions', { count: recovered })
          }
          await tickScheduledFlows()
        } catch (e) {
          log.error('scheduler tick failed', e)
          throw e
        }
      },
      {
        connection,
        concurrency: 1,
        removeOnComplete: { count: 50, age: 86400 },
        removeOnFail: { count: 100 },
      }
    )

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

  async close(): Promise<void> {
    await this.worker.close()
  }
}
