/**
 * Start Publishing Worker
 * 
 * Script para iniciar o worker de publicação
 * Executar: npx tsx scripts/start-worker.ts
 */

import { PublishingWorker } from '../lib/workers/publishing-worker'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
}

console.log('🚀 Starting Publishing Worker...')
console.log(`📡 Redis: ${connection.host}:${connection.port}`)

const worker = new PublishingWorker(connection)

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing worker...')
  await worker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, closing worker...')
  await worker.close()
  process.exit(0)
})

console.log('✅ Worker started and listening for jobs')

