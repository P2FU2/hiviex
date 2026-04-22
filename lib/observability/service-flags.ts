/**
 * Indicadores de serviços configurados (sem expor segredos).
 */

import { isStripeConfigured } from '@/lib/billing/stripe-client'
import { isObjectStorageConfigured } from '@/lib/storage/object-storage'

export function getServiceFlags() {
  const redisConfigured = !!(
    process.env.REDIS_URL?.trim() || process.env.REDIS_HOST?.trim()
  )
  return {
    databaseUrl: !!process.env.DATABASE_URL?.trim(),
    redis: redisConfigured,
    stripe: isStripeConfigured(),
    objectStorage: isObjectStorageConfigured(),
    sentry: !!(
      process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ||
      process.env.SENTRY_DSN?.trim()
    ),
    nextAuth: !!process.env.NEXTAUTH_SECRET?.trim(),
    tokenEncryption: !!process.env.TOKEN_ENCRYPTION_KEY?.trim(),
  }
}
