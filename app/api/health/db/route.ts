/**
 * Database Health Check API
 * 
 * Endpoint to check database connection status
 * Useful for monitoring and debugging in production
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'DATABASE_URL is not configured',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    // Test basic connection
    await prisma.$connect()

    // Test query
    await prisma.$queryRaw`SELECT 1 as test`

    // Get database info
    const userCount = await prisma.user.count()
    const tenantCount = await prisma.tenant.count()

    // Check pgvector extension
    const extensions = await prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname 
      FROM pg_extension 
      WHERE extname = 'vector'
    `

    return NextResponse.json({
      status: 'healthy',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        users: userCount,
        tenants: tenantCount,
        pgvector: extensions.length > 0,
      },
    })
  } catch (error: any) {
    console.error('Database health check failed:', error)

    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        code: error.code || 'UNKNOWN',
        timestamp: new Date().toISOString(),
        troubleshooting: {
          code: error.code,
          suggestions: getTroubleshootingTips(error.code),
        },
      },
      { status: 500 }
    )
  } finally {
    // Don't disconnect - let Prisma manage connection pool
  }
}

function getTroubleshootingTips(errorCode?: string): string[] {
  const tips: string[] = []

  if (errorCode === 'P1001') {
    tips.push('Check if DATABASE_URL is correct')
    tips.push('Verify database server is running')
    tips.push('Check network/firewall settings')
    tips.push('For Render: Use External Database URL for local dev, Internal for production')
  } else if (errorCode === 'P1000') {
    tips.push('Check database authentication credentials')
    tips.push('Verify username and password in DATABASE_URL')
  } else if (errorCode === 'P1011') {
    tips.push('Check TLS/SSL settings')
    tips.push('Add ?sslmode=require to DATABASE_URL')
  } else {
    tips.push('Check server logs for detailed error information')
    tips.push('Verify DATABASE_URL format is correct')
    tips.push('Ensure database is accessible from server')
  }

  return tips
}

