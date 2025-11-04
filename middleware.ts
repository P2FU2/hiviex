/**
 * Next.js Middleware
 * Handles authentication and route protection
 * 
 * Note: NextAuth v5 beta doesn't have withAuth middleware helper
 * We'll handle auth checks directly in the pages/components
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // For now, we'll let the pages handle authentication
  // The dashboard layout already checks for session
  // This middleware can be extended for additional logic like tenant detection
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/workspaces/:path*',
    '/api/agents/:path*',
    '/api/chat/:path*',
  ],
}

