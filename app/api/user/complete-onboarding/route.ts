/**
 * Complete Onboarding
 * 
 * Marks onboarding as completed for the user
 */

import { getAuthSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const session = await getAuthSession()
    
    // Mark onboarding as completed
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}

