/**
 * Workspace API Keys API Route
 * GET: Get workspace API keys
 * POST: Add new API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const workspaceId = resolvedParams.id

    const tenantMemberships = await getUserTenants(session.user.id)
    const membership = tenantMemberships.find((tm: any) => tm.tenantId === workspaceId)

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can view API keys' },
        { status: 403 }
      )
    }

    // Get API keys from workspace (stored in metadata or separate table)
    // For now, return empty array - you may want to create a WorkspaceApiKey model
    const apiKeys: any[] = []

    return NextResponse.json(apiKeys)
  } catch (error: any) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const workspaceId = resolvedParams.id

    const tenantMemberships = await getUserTenants(session.user.id)
    const membership = tenantMemberships.find((tm: any) => tm.tenantId === workspaceId)

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can add API keys' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, provider, key } = body

    if (!name || !provider || !key) {
      return NextResponse.json(
        { error: 'Name, provider, and key are required' },
        { status: 400 }
      )
    }

    // Store API key (you may want to encrypt it)
    // For now, return a mock response - you may want to create a WorkspaceApiKey model
    const newKey = {
      id: `key-${Date.now()}`,
      name,
      provider,
      key, // In production, encrypt this
    }

    return NextResponse.json(newKey, { status: 201 })
  } catch (error: any) {
    console.error('Error adding API key:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

