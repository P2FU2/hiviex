/**
 * Check if database tables exist and verify schema
 * Run with: npx tsx scripts/check-db.ts
 */

import { prisma } from '../lib/db/prisma'

async function checkDatabase() {
  try {
    console.log('🔍 Checking database schema...\n')

    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    console.log('📊 Found tables:')
    const expectedTables = [
      'users',
      'accounts',
      'sessions',
      'verification_tokens',
      'tenants',
      'tenant_users',
      'agents',
      'messages',
      'workflows',
      'workflow_agents',
      'subscriptions',
      'usage_records',
      'embeddings',
    ]

    const foundTableNames = tables.map((t) => t.tablename)
    
    expectedTables.forEach((table) => {
      if (foundTableNames.includes(table)) {
        console.log(`  ✅ ${table}`)
      } else {
        console.log(`  ❌ ${table} (missing)`)
      }
    })

    // Check pgvector extension
    try {
      const vectorCheck = await prisma.$queryRaw<Array<{ has_vector: boolean }>>`
        SELECT EXISTS(
          SELECT 1 FROM pg_extension WHERE extname = 'vector'
        ) as has_vector
      `
      
      if (vectorCheck[0]?.has_vector) {
        console.log('\n✅ pgvector extension is installed')
      } else {
        console.log('\n⚠️  pgvector extension is NOT installed')
        console.log('   Run: CREATE EXTENSION IF NOT EXISTS vector;')
      }
    } catch (error) {
      console.log('\n⚠️  Could not check pgvector:', error)
    }

    // Count records in key tables
    console.log('\n📈 Record counts:')
    try {
      const userCount = await prisma.user.count()
      console.log(`  Users: ${userCount}`)
    } catch (e) {
      console.log(`  Users: Error counting`)
    }

    try {
      const tenantCount = await prisma.tenant.count()
      console.log(`  Tenants: ${tenantCount}`)
    } catch (e) {
      console.log(`  Tenants: Error counting`)
    }

    try {
      const agentCount = await prisma.agent.count()
      console.log(`  Agents: ${agentCount}`)
    } catch (e) {
      console.log(`  Agents: Error counting`)
    }

    await prisma.$disconnect()
    console.log('\n✅ Database check completed!')
  } catch (error) {
    console.error('❌ Database check failed:', error)
    await prisma.$disconnect().catch(() => {})
    process.exit(1)
  }
}

checkDatabase()

