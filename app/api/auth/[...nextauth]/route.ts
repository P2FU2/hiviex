/**
 * NextAuth.js API Route Handler
 * NextAuth v5 beta
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/config'

const { handlers, auth, signIn, signOut } = NextAuth(authOptions)

export { auth, signIn, signOut }

export const GET = handlers.GET
export const POST = handlers.POST

