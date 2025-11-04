/**
 * NextAuth.js API Route Handler
 * NextAuth v5 beta
 * 
 * Only exports GET and POST handlers for the route
 * Use lib/auth/index.ts for auth, signIn, signOut
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/config'

const { handlers } = NextAuth(authOptions)

export const GET = handlers.GET
export const POST = handlers.POST

