/**
 * Workspace API Route
 * PUT: Update workspace
 * DELETE: Delete a workspace
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle Next.js 15 params format
    const resolvedParams = await Promise.resolve(params)
    const workspaceId = resolvedParams.id

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    if (!tenantIds.includes(workspaceId)) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user is OWNER or ADMIN
    const membership = tenantMemberships.find((tm: any) => tm.tenantId === workspaceId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can update workspaces' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Check if slug is already taken by another workspace
    const existingWorkspace = await prisma.tenant.findFirst({
      where: {
        slug,
        id: { not: workspaceId },
      },
    })

    if (existingWorkspace) {
      return NextResponse.json(
        { error: 'Slug already taken' },
        { status: 400 }
      )
    }

    // Update workspace - only fields that exist in schema (name and slug)
    const updatedWorkspace = await prisma.tenant.update({
      where: { id: workspaceId },
      data: {
        name,
        slug,
      },
    })

    return NextResponse.json(updatedWorkspace)
  } catch (error: any) {
    console.error('Error updating workspace:', error)
    
    // Return more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle Next.js 15 params format
    const resolvedParams = await Promise.resolve(params)
    const workspaceId = resolvedParams.id

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    const tenantMemberships = await getUserTenants(session.user.id)
    const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

    if (!tenantIds.includes(workspaceId)) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user is OWNER
    const membership = tenantMemberships.find((tm: any) => tm.tenantId === workspaceId)
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    if (membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can delete workspaces' },
        { status: 403 }
      )
    }

    // Delete workspace (cascade will handle related data)
    await prisma.tenant.delete({
      where: { id: workspaceId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
