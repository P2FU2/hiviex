/**
 * Modelos e limites padrão alinhados a capacidades atuais dos fornecedores.
 * IDs estáveis documentados: OpenAI (gpt-4o), Anthropic (Claude Sonnet 4.6), Cohere Chat v2.
 */

export const LLM_DEFAULTS = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-6',
  cohere: 'command-a-03-2025',
  /** Limite de conclusão quando o agente não define maxTokens */
  maxOutputTokens: 4096,
}

export function resolveLlmModel(provider: string, configured?: string | null): string {
  const p = (provider || 'openai').toLowerCase().trim()
  const fallback =
    p === 'anthropic'
      ? LLM_DEFAULTS.anthropic
      : p === 'cohere'
        ? LLM_DEFAULTS.cohere
        : LLM_DEFAULTS.openai
  const c = configured?.trim()
  return c || fallback
}

export function resolveMaxOutputTokens(configured?: number | null): number {
  if (configured != null && configured > 0) {
    return Math.min(configured, 128_000)
  }
  return LLM_DEFAULTS.maxOutputTokens
}
