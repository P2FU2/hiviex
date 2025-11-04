/**
 * NextAuth.js Exports
 * 
 * Exports auth, signIn, and signOut functions for use across the app
 * Separate from route handler to avoid Next.js route export restrictions
 */

import NextAuth from 'next-auth'
import { authOptions } from './config'

// Initialize NextAuth with error handling
let authInstance: any
let signInInstance: any
let signOutInstance: any

try {
  const instance = NextAuth(authOptions)
  authInstance = instance.auth
  signInInstance = instance.signIn
  signOutInstance = instance.signOut
} catch (error) {
  console.error('Failed to initialize NextAuth:', error)
  // Provide fallback functions to prevent app crash
  authInstance = async () => null
  signInInstance = async () => ({ error: 'Configuration' })
  signOutInstance = async () => ({ error: 'Configuration' })
}

export const auth = authInstance
export const signIn = signInInstance
export const signOut = signOutInstance

