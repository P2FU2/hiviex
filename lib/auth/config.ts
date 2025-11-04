/**
 * NextAuth.js Configuration
 * Multi-tenant authentication with Prisma adapter
 */

import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
// @ts-ignore - bcryptjs types are included in the package
import bcrypt from 'bcryptjs'

// Filter providers based on environment variables
const providers: any[] = []

// Credentials Provider for email/password login
// This validates users against the database
providers.push(
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Email and password are required')
      }

      // Find user in database
      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
        include: {
          accounts: {
            where: { provider: 'credentials' },
          },
        },
      })

      if (!user) {
        throw new Error('Invalid email or password')
      }

      // Check if user has a credentials account (password stored)
      const credentialsAccount = user.accounts.find(
        (acc: any) => acc.provider === 'credentials'
      )

      if (!credentialsAccount) {
        // User exists but doesn't have a password set
        // This means they signed up with OAuth only
        throw new Error('Please sign in with Google or GitHub')
      }

      // Verify password (stored in providerAccountId or access_token field)
      // Note: In production, passwords should be hashed and stored securely
      // For now, we'll check if the account exists and password matches
      const isValid = await bcrypt.compare(
        credentials.password as string,
        credentialsAccount.access_token || '' // Password hash stored here temporarily
      )

      if (!isValid) {
        throw new Error('Invalid email or password')
      }

      // Return user object
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      }
    },
  })
)

// Only add EmailProvider if SMTP is configured
if (process.env.SMTP_HOST) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.SMTP_FROM || 'noreply@hiviex.com',
    })
  )
}

// Only add GoogleProvider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

// Only add GitHubProvider if credentials are configured
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  )
}

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️  NEXTAUTH_SECRET is not set. Authentication may not work correctly.')
}

if (!process.env.NEXTAUTH_URL) {
  console.warn('⚠️  NEXTAUTH_URL is not set. Using default: http://localhost:3000')
}

export const authOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers,
  session: {
    strategy: 'jwt' as const,
  },
  // Using modal popup for signin - intercept page shows friendly message
  pages: {
    signIn: '/signin', // Intercept page with friendly message
    signOut: '/',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async redirect({ url, baseUrl }: any) {
      // Redirect to dashboard after successful login
      if (url.startsWith(baseUrl)) {
        return url
      }
      // If no callback URL, redirect to dashboard
      return `${baseUrl}/dashboard`
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
  trustHost: true, // Required for Render and other hosting platforms
}

