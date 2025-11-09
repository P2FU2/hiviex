/**
 * User Settings API Route
 * GET: Get user settings
 * PUT: Update user settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { encrypt, decrypt } from '@/lib/utils/encryption'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get settings from user metadata or return defaults
    // For now, return user info and empty API keys
    // In production, fetch from UserApiKey table or encrypted metadata
    return NextResponse.json({
      name: user.name,
      email: user.email,
      apiKeys: [], // In production, fetch from database
      notifications: true,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, apiKeys } = body

    // Update user
    const updateData: any = {}
    if (name !== undefined) updateData.name = name

    // Store API keys in a separate table or user metadata
    // For now, we'll store in a JSON field (in production, use proper encryption and separate table)
    // Note: This requires adding a metadata field to User model or creating UserSettings table
    
    // For now, store in a simple JSON structure
    // In production, create a UserApiKey table:
    // model UserApiKey {
    //   id String @id @default(cuid())
    //   userId String
    //   name String
    //   provider String
    //   key String // encrypted
    //   ...
    // }
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    // Store API keys (in production, use proper encryption and separate table)
    // For now, we'll just return success - implement proper storage based on your schema

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

