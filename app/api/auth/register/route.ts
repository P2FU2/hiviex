/**
 * User Registration API
 * 
 * Creates a new user account with email/password
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and credentials account
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        accounts: {
          create: {
            type: 'credentials',
            provider: 'credentials',
            providerAccountId: email,
            access_token: hashedPassword, // Store password hash
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Database connection errors
    if (error.code === 'P1001' || error.code === 'P1000' || error.code === 'P1011') {
      console.error('Database connection error:', error.code, error.message)
      return NextResponse.json(
        { 
          error: 'Database connection error. Please try again later.',
          code: error.code,
          hint: getConnectionHint(error.code)
        },
        { status: 500 }
      )
    }

    if (error.message?.includes('prisma') || error.message?.includes('database')) {
      console.error('Database error:', error)
      return NextResponse.json(
        { 
          error: 'Database connection error. Please try again later.',
          code: error.code || 'UNKNOWN'
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to create user',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

function getConnectionHint(errorCode: string): string {
  switch (errorCode) {
    case 'P1001':
      return 'Cannot reach database server. Check DATABASE_URL and network settings.'
    case 'P1000':
      return 'Authentication failed. Check database credentials.'
    case 'P1011':
      return 'TLS error. Ensure SSL is properly configured.'
    default:
      return 'Check server logs for more details.'
  }
}

