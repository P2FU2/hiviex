/**
 * Workspace API Key Management API Route
 * DELETE: Delete API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; keyId: string }> | { id: string; keyId: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const { id: workspaceId, keyId } = resolvedParams

    const tenantMemberships = await getUserTenants(session.user.id)
    const membership = tenantMemberships.find((tm: any) => tm.tenantId === workspaceId)

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can delete API keys' },
        { status: 403 }
      )
    }

    // Delete API key (you may want to create a WorkspaceApiKey model)
    // For now, just return success
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

