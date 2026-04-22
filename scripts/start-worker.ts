/**
 * Start Publishing Worker
 *
 * Script para iniciar o worker de publicação
 * Executar: npx tsx scripts/start-worker.ts
 */

import { Queue } from 'bullmq'
import { PublishingWorker } from '../lib/workers/publishing-worker'
import { FlowExecutionWorker } from '../lib/workers/flow-execution-worker'
import { FlowScheduledTickWorker } from '../lib/workers/flow-scheduled-tick-worker'
import { InfluencerGenerationWorker } from '../lib/workers/influencer-generation-worker'
import { VideoIngestWorker } from '../lib/workers/video-ingest-worker'
import { VideoTranscribeWorker } from '../lib/workers/video-transcribe-worker'
import { VideoClipAnalysisWorker } from '../lib/workers/video-clip-analysis-worker'
import { VideoClipRenderWorker } from '../lib/workers/video-clip-render-worker'
import { VideoCaptionRenderWorker } from '../lib/workers/video-caption-render-worker'
import { VideoFinalMuxWorker } from '../lib/workers/video-final-mux-worker'
import { getBullMQConnection } from '../lib/redis/bullmq-connection'
import { getWorkerRedis } from '../lib/redis/worker-redis'

const connection = getBullMQConnection()

console.log(
  '🚀 Starting workers (publishing + flow-execution + flow-scheduled-tick + influencer-generation + video-ingest + video-transcribe + video-clip-analysis + video-clip-render + video-caption-render + video-final-mux)...'
)
console.log(`📡 Redis: ${connection.host}:${connection.port}`)

async function registerFlowScheduledRepeat(): Promise<void> {
  try {
    const redis = getWorkerRedis()
    const ok = await redis.set(
      'hiviex:bullmq:register-flow-scheduled',
      '1',
      'EX',
      180,
      'NX'
    )
    if (!ok) {
      console.log(
        'ℹ️  Registo do job repetível flow-scheduled ignorado (outro processo ou já existente).'
      )
      return
    }
    const q = new Queue('flow-scheduled-tick', { connection })
    try {
      await q.add(
        'tick',
        {},
        { jobId: 'flow-scheduled-repeat', repeat: { every: 60_000 } }
      )
      console.log('✅ Job repetível flow-scheduled-tick registado.')
    } finally {
      await q.close()
    }
  } catch (e) {
    console.error('Falha ao registar job repetível flow-scheduled:', e)
  }
}

void registerFlowScheduledRepeat()

const publishingWorker = new PublishingWorker(connection)
const flowWorker = new FlowExecutionWorker(connection)
const scheduledTickWorker = new FlowScheduledTickWorker(connection)
const influencerGenWorker = new InfluencerGenerationWorker(connection)
const videoIngestWorker = new VideoIngestWorker(connection)
const videoTranscribeWorker = new VideoTranscribeWorker(connection)
const videoClipAnalysisWorker = new VideoClipAnalysisWorker(connection)
const videoClipRenderWorker = new VideoClipRenderWorker(connection)
const videoCaptionRenderWorker = new VideoCaptionRenderWorker(connection)
const videoFinalMuxWorker = new VideoFinalMuxWorker(connection)

function startHeartbeat(): void {
  const beat = () => {
    void getWorkerRedis()
      .set('hiviex:health:worker', String(Date.now()), 'EX', 90)
      .catch(() => {})
  }
  beat()
  setInterval(beat, 25_000)
}

startHeartbeat()

async function shutdown(signal: string) {
  console.log(`🛑 ${signal} received, closing workers...`)
  await Promise.all([
    publishingWorker.close(),
    flowWorker.close(),
    scheduledTickWorker.close(),
    influencerGenWorker.close(),
    videoIngestWorker.close(),
    videoTranscribeWorker.close(),
    videoClipAnalysisWorker.close(),
    videoClipRenderWorker.close(),
    videoCaptionRenderWorker.close(),
    videoFinalMuxWorker.close(),
  ])
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

console.log(
  '✅ Workers listening (queues: publishing, flow-execution, flow-scheduled-tick, influencer-generation, video-ingest, video-transcribe, video-clip-analysis, video-clip-render, video-caption-render, video-final-mux)'
)
