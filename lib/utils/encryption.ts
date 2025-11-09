/**
 * Encryption utilities for API keys
 * 
 * Simple encryption for API keys (in production, use proper encryption)
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'

export function encrypt(text: string): string {
  // Simple base64 encoding (in production, use proper encryption like AES)
  if (!text) return ''
  return Buffer.from(text).toString('base64')
}

export function decrypt(encrypted: string): string {
  // Simple base64 decoding
  if (!encrypted) return ''
  try {
    return Buffer.from(encrypted, 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

