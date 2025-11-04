/**
 * Test Database Connection Script
 * 
 * Tests PostgreSQL connection and displays useful information
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function testConnection() {
  console.log('🔍 Testing database connection...\n')

  // Check DATABASE_URL
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set in environment variables')
    process.exit(1)
  }

  // Mask password in URL for logging
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@')
  console.log(`📊 DATABASE_URL: ${maskedUrl}\n`)

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...')
    await prisma.$connect()
    console.log('✅ Connection successful!\n')

    // Test 2: Query database
    console.log('2️⃣ Testing database query...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query successful!\n', result)

    // Test 3: Check if tables exist
    console.log('3️⃣ Checking if tables exist...')
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    console.log(`✅ Found ${tables.length} tables:`)
    tables.forEach((table) => {
      console.log(`   - ${table.tablename}`)
    })
    console.log('')

    // Test 4: Check pgvector extension
    console.log('4️⃣ Checking pgvector extension...')
    const extensions = await prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname 
      FROM pg_extension 
      WHERE extname = 'vector'
    `
    if (extensions.length > 0) {
      console.log('✅ pgvector extension is installed\n')
    } else {
      console.log('⚠️  pgvector extension is NOT installed')
      console.log('   Run: CREATE EXTENSION IF NOT EXISTS vector;\n')
    }

    // Test 5: Check User table
    console.log('5️⃣ Checking User table...')
    const userCount = await prisma.user.count()
    console.log(`✅ User table exists with ${userCount} users\n`)

    console.log('🎉 All tests passed! Database connection is working correctly.')
  } catch (error: any) {
    console.error('❌ Database connection failed!\n')
    console.error('Error details:', error.message)
    
    if (error.code) {
      console.error(`\nError code: ${error.code}`)
    }

    // Common error codes and solutions
    if (error.code === 'P1001') {
      console.error('\n💡 Solution:')
      console.error('   - Check if DATABASE_URL is correct')
      console.error('   - Verify database is running')
      console.error('   - Check network/firewall settings')
    } else if (error.code === 'P1000') {
      console.error('\n💡 Solution:')
      console.error('   - Check database authentication credentials')
      console.error('   - Verify username and password in DATABASE_URL')
    } else if (error.code === 'P1011') {
      console.error('\n💡 Solution:')
      console.error('   - Check TLS/SSL settings')
      console.error('   - Add ?sslmode=require to DATABASE_URL')
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
  .catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })

