import { createHash, randomBytes, timingSafeEqual } from 'crypto'

/** Compara segredos com tempo constante (via hash SHA-256 fixo). */
export function compareWebhookSecrets(provided: string, stored: string): boolean {
  if (!provided || !stored) return false
  try {
    const ah = createHash('sha256').update(provided, 'utf8').digest()
    const bh = createHash('sha256').update(stored, 'utf8').digest()
    return timingSafeEqual(ah, bh)
  } catch {
    return false
  }
}

export function generateWebhookSecret(): string {
  return randomBytes(24).toString('hex')
}
