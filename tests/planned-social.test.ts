/**
 * Provedores sociais planeados — sem throw na factory; publicação falha de forma controlada.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { createProvider } from '../lib/integrations/providers'
import { plannedIntegrationMessage } from '../lib/integrations/providers/planned-social-provider'

test('createProvider não lança para plataformas ainda planeadas (TikTok, Kwai, Gmail)', () => {
  assert.ok(createProvider('TIKTOK'))
  assert.ok(createProvider('KWAII'))
  assert.ok(createProvider('GMAIL'))
})

test('createProvider devolve FacebookProvider real', () => {
  const p = createProvider('FACEBOOK')
  assert.equal(p.platform, 'FACEBOOK')
  assert.equal(p.name, 'Facebook')
})

test('PlannedSocialProvider.publishPost devolve success: false', async () => {
  const p = createProvider('TIKTOK')
  const r = await p.publishPost(
    { accessToken: 'x' },
    ['https://example.com/v.mp4'],
    { caption: 't' }
  )
  assert.equal(r.success, false)
  assert.ok(r.error?.includes('TikTok'))
})

test('plannedIntegrationMessage', () => {
  assert.match(plannedIntegrationMessage('FACEBOOK'), /Facebook/)
})
