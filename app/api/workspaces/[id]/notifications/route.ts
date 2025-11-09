/**
 * Workspace Notifications API Route
 * GET: Get workspace notification settings
 * PUT: Update workspace notification settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'

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
        { error: 'Only workspace owners and admins can view notifications' },
        { status: 403 }
      )
    }

    // Get notification settings (stored in metadata or separate table)
    // For now, return defaults
    const notifications = {
      notifyOnNewMembers: true,
      notifyOnWorkflowExecutions: true,
      notifyOnAgentErrors: false,
    }

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
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

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can update notifications' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { notifyOnNewMembers, notifyOnWorkflowExecutions, notifyOnAgentErrors } = body

    // Store notification settings in workspace metadata/config
    // This is a placeholder - you may want to add a notifications field to Tenant model
    
    return NextResponse.json({
      notifyOnNewMembers: notifyOnNewMembers ?? true,
      notifyOnWorkflowExecutions: notifyOnWorkflowExecutions ?? true,
      notifyOnAgentErrors: notifyOnAgentErrors ?? false,
    })
  } catch (error: any) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

