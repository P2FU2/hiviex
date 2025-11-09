/**
 * Invite Member API Route
 * POST: Invite a new member to workspace
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { TenantRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

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
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    if (!tenantIds.includes(workspaceId)) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const membership = tenantMemberships.find((tm: any) => tm.tenantId === workspaceId)
    if (membership?.role !== 'OWNER' && membership?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can invite members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. User must have an account first.' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: {
          tenantId: workspaceId,
          userId: user.id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 400 }
      )
    }

    // Only OWNER can invite ADMIN
    const finalRole = role === 'ADMIN' && membership.role !== 'OWNER' 
      ? TenantRole.MEMBER 
      : (role === 'ADMIN' ? TenantRole.ADMIN : TenantRole.MEMBER)

    // Create membership
    const newMember = await prisma.tenantUser.create({
      data: {
        tenantId: workspaceId,
        userId: user.id,
        role: finalRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(newMember, { status: 201 })
  } catch (error: any) {
    console.error('Error inviting member:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

