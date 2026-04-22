/**
 * Embeddings OpenAI (text-embedding-3-small, 1536 dim — alinhado ao schema pgvector).
 */

export async function createEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada')
  }
  const input = text.slice(0, 8000)
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI embeddings: ${res.status} ${err.slice(0, 300)}`)
  }
  const data = (await res.json()) as {
    data?: Array<{ embedding: number[] }>
  }
  const emb = data.data?.[0]?.embedding
  if (!emb?.length) {
    throw new Error('Resposta de embedding vazia')
  }
  return emb
}

/** Literal aceite por PostgreSQL/pgvector a partir de array numérico confiável. */
export function toPgVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}
