/**
 * Start Publishing Worker
 * 
 * Script para iniciar o worker de publicação
 * Executar: npx tsx scripts/start-worker.ts
 */

import { PublishingWorker } from '../lib/workers/publishing-worker'
import { FlowExecutionWorker } from '../lib/workers/flow-execution-worker'
import { getBullMQConnection } from '../lib/redis/bullmq-connection'

const connection = getBullMQConnection()

console.log('🚀 Starting workers (publishing + flow-execution)...')
console.log(`📡 Redis: ${connection.host}:${connection.port}`)

const publishingWorker = new PublishingWorker(connection)
const flowWorker = new FlowExecutionWorker(connection)

async function shutdown(signal: string) {
  console.log(`🛑 ${signal} received, closing workers...`)
  await Promise.all([publishingWorker.close(), flowWorker.close()])
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

console.log('✅ Workers listening (queues: publishing, flow-execution)')

