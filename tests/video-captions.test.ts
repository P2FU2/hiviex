/**
 * Legendas / mux — validadores e SRT. Executar: npm test (inclui este ficheiro)
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createCaptionTrackSchema,
  patchCaptionTrackSchema,
  captionRenderBodySchema,
  finalMuxBodySchema,
} from '../lib/validators/video-captions'
import { segmentsToSrt, normalizeCaptionSegments } from '../lib/video/srt-from-segments'

/** CUID válido para schemas Zod */
const VID = 'cjld2cjxh0000qzrmn831i7rn'
const VID2 = 'cjld2cjxh0000qzrmn831i7ro'
const AUD = 'cjld2cjxh0000qzrmn831i7rp'

test('createCaptionTrackSchema aceita segmentos mínimos', () => {
  const r = createCaptionTrackSchema.safeParse({
    locale: 'pt-BR',
    segments: [{ startMs: 0, endMs: 1000, text: 'Olá' }],
  })
  assert.equal(r.success, true)
})

test('createCaptionTrackSchema rejeita segmento vazio', () => {
  const r = createCaptionTrackSchema.safeParse({ segments: [] })
  assert.equal(r.success, false)
})

test('patchCaptionTrackSchema permite só segments', () => {
  const r = patchCaptionTrackSchema.safeParse({
    segments: [{ startMs: 0, endMs: 500, text: 'x' }],
  })
  assert.equal(r.success, true)
})

test('captionRenderBodySchema exige cuid', () => {
  assert.equal(captionRenderBodySchema.safeParse({ sourceMediaAssetId: 'not-a-cuid' }).success, false)
  assert.equal(
    captionRenderBodySchema.safeParse({ sourceMediaAssetId: VID }).success,
    true
  )
})

test('finalMuxBodySchema — vídeo + áudio asset opcional', () => {
  const r = finalMuxBodySchema.safeParse({
    videoMediaAssetId: VID,
    audioMediaAssetId: AUD,
  })
  assert.equal(r.success, true)
})

test('finalMuxBodySchema — audioUrl HTTPS', () => {
  assert.equal(
    finalMuxBodySchema.safeParse({
      videoMediaAssetId: VID,
      audioUrl: 'http://insecure.example/a.mp3',
    }).success,
    false
  )
  assert.equal(
    finalMuxBodySchema.safeParse({
      videoMediaAssetId: VID2,
      audioUrl: 'https://cdn.example/a.mp3',
    }).success,
    true
  )
})

test('segmentsToSrt gera blocos numerados', () => {
  const s = segmentsToSrt([
    { startMs: 0, endMs: 2000, text: 'A' },
    { startMs: 2000, endMs: 4000, text: 'B' },
  ])
  assert.match(s, /^1\n/)
  assert.match(s, /\n2\n/)
  assert.match(s, /-->/)
})

test('normalizeCaptionSegments aceita array e objeto com segments', () => {
  const a = normalizeCaptionSegments([
    { startMs: 0, endMs: 1000, text: ' ok ' },
  ])
  assert.equal(a.length, 1)
  assert.equal(a[0].text, ' ok ')
  const b = normalizeCaptionSegments({
    segments: [{ startMs: 0, endMs: 2000, text: 'y' }],
  })
  assert.equal(b.length, 1)
})

test('normalizeCaptionSegments ignora linhas inválidas', () => {
  const a = normalizeCaptionSegments([
    { startMs: 0, endMs: 1000, text: 'bom' },
    { startMs: 'x', endMs: 1, text: '' },
    null,
  ])
  assert.equal(a.length, 1)
})

test('normalizeCaptionSegments falha sem nenhum válido', () => {
  assert.throws(() => normalizeCaptionSegments([]), /válido/)
})
