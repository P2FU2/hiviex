/**
 * Avaliação de condições sem eval() — apenas substituição de ${path} e operadores simples.
 */

function resolvePath(context: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.').filter(Boolean)
  let value: unknown = context
  for (const part of parts) {
    if (value && typeof value === 'object' && part in (value as object)) {
      value = (value as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return value
}

function substitutePlaceholders(
  condition: string,
  context: Record<string, unknown>
): string {
  return condition.replace(/\$\{([^}]+)\}/g, (_match, path: string) => {
    const v = resolvePath(context, path.trim())
    if (v === null || v === undefined) return ''
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  })
}

function parseComparable(s: string): string | number | boolean {
  const t = s.trim()
  if (t === 'true') return true
  if (t === 'false') return false
  if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
    return JSON.parse(t) as string
  }
  if (t.startsWith("'") && t.endsWith("'") && t.length >= 2) {
    return t.slice(1, -1)
  }
  const n = Number(t)
  if (t !== '' && !Number.isNaN(n) && Number.isFinite(n)) return n
  return t
}

/**
 * Suporta: ==, !=, >, <, >=, <= após substituição de placeholders.
 * Valores literais true/false ou números/strings simples.
 */
export function safeEvaluateConditionString(
  condition: string,
  context: Record<string, unknown>
): boolean {
  try {
    let s = substitutePlaceholders(condition, context).trim()
    if (s === '' || s === 'false' || s === '0') return false
    if (s === 'true' || s === '1') return true

    const ops = ['>=', '<=', '==', '!=', '>', '<'] as const
    for (const op of ops) {
      const idx = s.indexOf(op)
      if (idx === -1) continue
      const left = parseComparable(s.slice(0, idx))
      const right = parseComparable(s.slice(idx + op.length))
      switch (op) {
        case '==':
          return left === right
        case '!=':
          return left !== right
        case '>':
          return Number(left) > Number(right)
        case '<':
          return Number(left) < Number(right)
        case '>=':
          return Number(left) >= Number(right)
        case '<=':
          return Number(left) <= Number(right)
        default:
          return false
      }
    }

    return Boolean(s)
  } catch {
    return false
  }
}
