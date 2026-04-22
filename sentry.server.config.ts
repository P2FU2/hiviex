/**
 * Sentry — runtime Node.js (API routes, RSC, server actions).
 * DSN público é seguro no cliente; no servidor pode usar o mesmo.
 */

import * as Sentry from '@sentry/nextjs'

const dsn =
  process.env.SENTRY_DSN?.trim() ||
  process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ||
  undefined

const tracesSampleRate = (() => {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE?.trim()
  if (raw != null && raw !== '') {
    const n = Number(raw)
    if (!Number.isNaN(n) && n >= 0 && n <= 1) return n
  }
  return process.env.NODE_ENV === 'production' ? 0.1 : 1.0
})()

Sentry.init({
  dsn: dsn || undefined,
  environment:
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    'development',
  tracesSampleRate,
  debug: false,
})
