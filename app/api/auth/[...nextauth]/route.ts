/**
 * NextAuth.js API Route Handler
 * NextAuth v5 beta
 */

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)

export const { GET, POST } = handlers

