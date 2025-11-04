/**
 * Workspaces API Routes
 * GET: List user's workspaces
 * POST: Create new workspace
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createTenant, getUserTenants } from '@/lib/utils/tenant'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenants = await getUserTenants(session.user.id)

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createWorkspaceSchema.parse(body)

    const tenant = await createTenant(data.name, session.user.id, data.slug)

    return NextResponse.json({ tenant }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

