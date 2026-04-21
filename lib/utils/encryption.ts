/**
 * Token / secret encryption (AES-256-GCM).
 * Replaces legacy base64 "encryption" — existing plaintext values in DB should be
 * re-saved via OAuth reconnect or a one-off migration.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LENGTH = 12
const KEY_LENGTH = 32
const SCRYPT_SALT = 'hiviex-token-v1'

function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY
  if (!raw) {
    if (process.env.NODE_ENV === 'production' && !isNextProductionBuild()) {
      throw new Error('TOKEN_ENCRYPTION_KEY (32-byte base64) is required in production')
    }
    return scryptSync('dev-only-insecure-key', SCRYPT_SALT, KEY_LENGTH)
  }

  const key = Buffer.from(raw, 'base64')
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes encoded as base64 (got ${key.length} bytes)`
    )
  }
  return key
}

const PREFIX = 'gcm:'

export function encrypt(plaintext: string): string {
  if (!plaintext) return ''
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const blob = Buffer.concat([iv, tag, enc]).toString('base64')
  return `${PREFIX}${blob}`
}

/**
 * Decrypts gcm:-prefixed payloads. Values without the prefix are returned as-is
 * (legacy plaintext rows until users reconnect OAuth).
 */
export function decrypt(payload: string): string {
  if (!payload) return ''

  if (!payload.startsWith(PREFIX)) {
    return payload
  }

  const buf = Buffer.from(payload.slice(PREFIX.length), 'base64')
  if (buf.length < IV_LENGTH + 16 + 1) {
    return ''
  }

  const iv = buf.subarray(0, IV_LENGTH)
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + 16)
  const data = buf.subarray(IV_LENGTH + 16)
  const key = getKey()
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf-8')
}
