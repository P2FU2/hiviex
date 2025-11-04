/**
 * NextAuth.js Exports
 * 
 * Exports auth, signIn, and signOut functions for use across the app
 * Separate from route handler to avoid Next.js route export restrictions
 */

import NextAuth from 'next-auth'
import { authOptions } from './config'

const { auth, signIn, signOut } = NextAuth(authOptions)

export { auth, signIn, signOut }

