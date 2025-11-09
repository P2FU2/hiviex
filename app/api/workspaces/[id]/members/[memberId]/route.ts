/**
 * Member Management API Route
 * PUT: Update member role
 * DELETE: Remove member from workspace
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
export const dynamic = 'force-dynamic'

type TenantRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> | { id: string; memberId: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const { id: workspaceId, memberId } = resolvedParams

    const tenantMemberships = await getUserTenants(session.user.id)
    const membership = tenantMemberships.find((tm: any) => tm.tenantId === workspaceId)

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can update members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { role } = body

    // Check if member exists
    const member = await (prisma as any).tenantUser.findUnique({
      where: { id: memberId },
    })

    if (!member || member.tenantId !== workspaceId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Only OWNER can change roles to ADMIN or remove OWNER
    if (role === 'ADMIN' && membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can assign admin role' },
        { status: 403 }
      )
    }

    if (member.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot modify owner role' },
        { status: 403 }
      )
    }

    // Update member role
    const updatedMember = await (prisma as any).tenantUser.update({
      where: { id: memberId },
      data: { role: role as TenantRole },
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

    return NextResponse.json(updatedMember)
  } catch (error: any) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> | { id: string; memberId: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const { id: workspaceId, memberId } = resolvedParams

    const tenantMemberships = await getUserTenants(session.user.id)
    const membership = tenantMemberships.find((tm: any) => tm.tenantId === workspaceId)

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can remove members' },
        { status: 403 }
      )
    }

    // Check if member exists
    const member = await (prisma as any).tenantUser.findUnique({
      where: { id: memberId },
    })

    if (!member || member.tenantId !== workspaceId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Cannot remove OWNER
    if (member.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner' },
        { status: 403 }
      )
    }

    // ADMIN can only remove MEMBER
    if (membership.role === 'ADMIN' && member.role !== 'MEMBER') {
      return NextResponse.json(
        { error: 'Admins can only remove members' },
        { status: 403 }
      )
    }

    // Remove member
    await (prisma as any).tenantUser.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

