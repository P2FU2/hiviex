/**
 * Testes mínimos — executar: npx tsx --test tests/ssrf.test.ts
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { isBlockedOutboundUrl } from '../lib/security/ssrf'

test('bloqueia loopback e metadata', () => {
  assert.equal(isBlockedOutboundUrl('http://127.0.0.1/'), true)
  assert.equal(isBlockedOutboundUrl('http://169.254.169.254/latest/meta-data/'), true)
  assert.equal(isBlockedOutboundUrl('http://localhost:8080/'), true)
})

test('permite HTTPS público típico', () => {
  assert.equal(isBlockedOutboundUrl('https://api.stripe.com/v1/'), false)
})

test('com allowlist só hosts permitidos', () => {
  const prev = process.env.HTTP_OUTBOUND_ALLOWLIST_HOSTS
  process.env.HTTP_OUTBOUND_ALLOWLIST_HOSTS = 'example.com'
  try {
    assert.equal(isBlockedOutboundUrl('https://example.com/hook'), false)
    assert.equal(isBlockedOutboundUrl('https://evil.com/'), true)
  } finally {
    if (prev === undefined) delete process.env.HTTP_OUTBOUND_ALLOWLIST_HOSTS
    else process.env.HTTP_OUTBOUND_ALLOWLIST_HOSTS = prev
  }
})
