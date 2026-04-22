/**
 * Testes — executar: npm test (inclui estes ficheiros)
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mergeIdentityPack,
  parseJsonObjectFromLlm,
} from '../lib/influencers/llm-json-parse'

test('parseJsonObjectFromLlm: JSON puro', () => {
  const o = parseJsonObjectFromLlm('{"a":1,"b":"x"}')
  assert.equal(o.a, 1)
  assert.equal(o.b, 'x')
})

test('parseJsonObjectFromLlm: bloco fenced json', () => {
  const raw = 'Aqui vai:\n```json\n{"ok":true}\n```\n'
  const o = parseJsonObjectFromLlm(raw)
  assert.equal(o.ok, true)
})

test('parseJsonObjectFromLlm: rejeita array', () => {
  assert.throws(() => parseJsonObjectFromLlm('[1,2]'))
})

test('mergeIdentityPack: funde objetos', () => {
  const m = mergeIdentityPack({ a: 1, b: 2 }, { b: 3, c: 4 })
  assert.deepEqual(m, { a: 1, b: 3, c: 4 })
})

test('mergeIdentityPack: atual inválido vira objeto vazio', () => {
  const m = mergeIdentityPack(null, { x: 1 })
  assert.deepEqual(m, { x: 1 })
})
