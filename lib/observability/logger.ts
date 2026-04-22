/**
 * Logs estruturados — JSON em produção, legível em desenvolvimento.
 * Use com correlação manual (requestId, tenantId) nos extras.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

function formatLine(
  scope: string,
  level: Level,
  message: string,
  extra?: Record<string, unknown>
): string {
  const payload = {
    ts: new Date().toISOString(),
    level,
    scope,
    message,
    ...extra,
  }
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(payload)
  }
  const extraStr = extra && Object.keys(extra).length ? ` ${JSON.stringify(extra)}` : ''
  return `[${payload.ts}] [${level.toUpperCase()}] [${scope}] ${message}${extraStr}`
}

export function createLogger(scope: string) {
  return {
    debug(message: string, extra?: Record<string, unknown>) {
      if (process.env.NODE_ENV === 'production') return
      console.debug(formatLine(scope, 'debug', message, extra))
    },
    info(message: string, extra?: Record<string, unknown>) {
      console.info(formatLine(scope, 'info', message, extra))
    },
    warn(message: string, extra?: Record<string, unknown>) {
      console.warn(formatLine(scope, 'warn', message, extra))
    },
    error(message: string, err?: unknown, extra?: Record<string, unknown>) {
      const e =
        err instanceof Error
          ? { errName: err.name, errMessage: err.message, errStack: err.stack }
          : err != null
            ? { err: String(err) }
            : {}
      console.error(formatLine(scope, 'error', message, { ...e, ...extra }))
    },
  }
}
