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
    // Handle case where field might not exist yet
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboardingCompleted: true },
      })

      return NextResponse.json({
        completed: user?.onboardingCompleted || false,
      })
    } catch (error: any) {
      // If field doesn't exist, assume not completed
      if (error?.code === 'P2009' || error?.message?.includes('onboardingCompleted')) {
        return NextResponse.json({
          completed: false,
          warning: 'Field may not exist yet. Run: npx prisma db push',
        })
      }
      throw error
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    // Return not completed as default
    return NextResponse.json({
      completed: false,
      error: 'Failed to check onboarding status',
    })
  }
}

