/**
 * Workspace Permissions API Route
 * GET: Get workspace permissions
 * PUT: Update workspace permissions
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

    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can view permissions' },
        { status: 403 }
      )
    }

    // Get permissions from workspace config (stored in metadata or separate table)
    // For now, return defaults
    const permissions = {
      membersCanCreateAgents: true,
      membersCanCreateWorkflows: true,
      approvalRequiredForNewMembers: false,
    }

    return NextResponse.json(permissions)
  } catch (error: any) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can update permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { membersCanCreateAgents, membersCanCreateWorkflows, approvalRequiredForNewMembers } = body

    // Store permissions in workspace metadata/config
    // For now, we'll store in a JSON field or create a separate table
    // This is a placeholder - you may want to add a permissions field to Tenant model
    
    return NextResponse.json({
      membersCanCreateAgents: membersCanCreateAgents ?? true,
      membersCanCreateWorkflows: membersCanCreateWorkflows ?? true,
      approvalRequiredForNewMembers: approvalRequiredForNewMembers ?? false,
    })
  } catch (error: any) {
    console.error('Error updating permissions:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

