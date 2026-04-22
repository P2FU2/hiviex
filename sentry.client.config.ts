import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined

const tracesSampleRate = (() => {
  const raw = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE?.trim()
  if (raw != null && raw !== '') {
    const n = Number(raw)
    if (!Number.isNaN(n) && n >= 0 && n <= 1) return n
  }
  return process.env.NODE_ENV === 'production' ? 0.1 : 1.0
})()

Sentry.init({
  dsn: dsn || undefined,
  environment:
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.NODE_ENV ||
    'development',
  tracesSampleRate,
})
