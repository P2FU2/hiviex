/**
 * Check Onboarding Status
 * 
 * Returns whether the user has completed onboarding
 */

import { getAuthSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getAuthSession()
    
    // Check if user has completed onboarding
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true },
    })

    return NextResponse.json({
      completed: user?.onboardingCompleted || false,
    })
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    )
  }
}

