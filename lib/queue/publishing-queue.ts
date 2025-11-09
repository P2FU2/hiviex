/**
 * Publishing Queue
 * 
 * Queue BullMQ para agendar jobs de publicação
 */

import { Queue } from 'bullmq'
import type { SocialPlatform } from '@/lib/types/domain'

interface SchedulePostJob {
  scheduledPostId: string
  tenantId: string
  platform: SocialPlatform
}

export class PublishingQueue {
  private queue: Queue<SchedulePostJob>

  constructor(connection: { host: string; port: number; password?: string }) {
    this.queue = new Queue<SchedulePostJob>('publishing', { connection })
  }

  /**
   * Agenda um post para publicação
   */
  async schedulePost(
    scheduledPostId: string,
    tenantId: string,
    platform: SocialPlatform,
    scheduledAt: Date
  ): Promise<string> {
    const job = await this.queue.add(
      'publish',
      {
        scheduledPostId,
        tenantId,
        platform,
      },
      {
        jobId: `post-${scheduledPostId}`, // ID único baseado no post
        delay: scheduledAt.getTime() - Date.now(), // Delay até o horário agendado
        attempts: 3, // Tenta 3 vezes em caso de falha
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, 10s, 20s
        },
      }
    )

    return job.id!
  }

  /**
   * Cancela um post agendado
   */
  async cancelPost(jobId: string): Promise<boolean> {
    const job = await this.queue.getJob(jobId)
    if (!job) {
      return false
    }

    await job.remove()
    return true
  }

  /**
   * Obtém status de um job
   */
  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId)
    if (!job) {
      return null
    }

    const state = await job.getState()
    return {
      id: job.id,
      state,
      progress: job.progress,
      data: job.data,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
    }
  }

  async close() {
    await this.queue.close()
  }
}

