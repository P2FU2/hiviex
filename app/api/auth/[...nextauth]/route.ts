/**
 * NextAuth.js API Route Handler
 * NextAuth v5 beta
 * 
 * Only exports GET and POST handlers for the route
 * Use lib/auth/index.ts for auth, signIn, signOut
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

let handlers: any

try {
  const instance = NextAuth(authOptions)
  handlers = instance.handlers
} catch (error) {
  console.error('Failed to initialize NextAuth handlers:', error)
  // Provide fallback handlers
  handlers = {
    GET: async () => {
      return NextResponse.json(
        { error: 'Authentication configuration error. Check server logs.' },
        { status: 500 }
      )
    },
    POST: async () => {
      return NextResponse.json(
        { error: 'Authentication configuration error. Check server logs.' },
        { status: 500 }
      )
    },
  }
}

export const GET = handlers.GET
export const POST = handlers.POST

