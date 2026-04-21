/**
 * Estado OAuth assinado (HMAC-SHA256) para mitigar CSRF / troca de tenant.
 * Formato: base64url(payload).base64url(hmac)
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { getOAuthStateSecret } from '@/lib/auth/secrets'

const TTL_MS = 15 * 60 * 1000

type Payload = { t: string; u: string; e: number }

export function signOAuthState(tenantId: string, userId: string): string {
  const payload: Payload = {
    t: tenantId,
    u: userId,
    e: Date.now() + TTL_MS,
  }
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = createHmac('sha256', getOAuthStateSecret())
    .update(payloadB64)
    .digest('base64url')
  return `${payloadB64}.${sig}`
}

export function verifyOAuthState(state: string): { tenantId: string; userId: string } | null {
  const parts = state.split('.')
  if (parts.length !== 2) return null

  const [payloadB64, sig] = parts
  if (!payloadB64 || !sig) return null

  const expected = createHmac('sha256', getOAuthStateSecret())
    .update(payloadB64)
    .digest('base64url')

  try {
    const a = Buffer.from(sig, 'base64url')
    const b = Buffer.from(expected, 'base64url')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  let payload: Payload
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (
    typeof payload.t !== 'string' ||
    typeof payload.u !== 'string' ||
    typeof payload.e !== 'number'
  ) {
    return null
  }

  if (Date.now() > payload.e) return null

  return { tenantId: payload.t, userId: payload.u }
}
