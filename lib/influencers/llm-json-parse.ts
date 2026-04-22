/**
 * Extrai objeto JSON de respostas LLM (incl. blocos ```json).
 */

export function parseJsonObjectFromLlm(text: string): Record<string, unknown> {
  let t = text.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)```/im.exec(t)
  if (fence) t = fence[1].trim()

  const parsed: unknown = JSON.parse(t)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Resposta LLM não é um objeto JSON.')
  }
  return parsed as Record<string, unknown>
}

export function mergeIdentityPack(
  current: unknown,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const base =
    current !== null && typeof current === 'object' && !Array.isArray(current)
      ? (current as Record<string, unknown>)
      : {}
  return { ...base, ...patch }
}
