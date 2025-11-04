/**
 * Test database and Redis connections
 * Run with: npx tsx scripts/test-connections.ts
 */

import { prisma } from '../lib/db/prisma'
import { testRedisConnection } from '../lib/queues/redis'

async function testDatabase() {
  try {
    console.log('🔍 Testing PostgreSQL connection...')
    await prisma.$connect()
    console.log('✅ PostgreSQL connected successfully!')

    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database query test passed:', result)

    // Check if pgvector extension is installed
    try {
      const vectorCheck = await prisma.$queryRaw`
        SELECT EXISTS(
          SELECT 1 FROM pg_extension WHERE extname = 'vector'
        ) as has_vector
      `
      console.log('📊 pgvector extension check:', vectorCheck)
    } catch (error) {
      console.warn('⚠️  Could not check pgvector extension:', error)
    }

    await prisma.$disconnect()
    return true
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error)
    return false
  }
}

async function testRedis() {
  try {
    console.log('\n🔍 Testing Redis connection...')
    const connected = await testRedisConnection()
    if (connected) {
      console.log('✅ Redis connected successfully!')
      return true
    } else {
      console.error('❌ Redis connection failed')
      return false
    }
  } catch (error) {
    console.error('❌ Redis connection error:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting connection tests...\n')

  const dbResult = await testDatabase()
  const redisResult = await testRedis()

  console.log('\n📊 Test Results:')
  console.log(`  PostgreSQL: ${dbResult ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Redis: ${redisResult ? '✅ PASS' : '❌ FAIL'}`)

  if (dbResult && redisResult) {
    console.log('\n🎉 All connections successful!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some connections failed. Please check your .env file.')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

