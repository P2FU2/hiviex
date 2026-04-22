/**
 * Pesquisa semântica (pgvector) e ingestão — metadata isolada por tenantId.
 */

import { prisma } from '@/lib/db/prisma'
import { createEmbedding, toPgVectorLiteral } from '@/lib/embeddings/openai-embed'

export async function searchRelevantContext(opts: {
  tenantId: string
  agentId: string
  query: string
  limit?: number
}): Promise<string | null> {
  const limit = Math.min(Math.max(opts.limit ?? 4, 1), 12)
  const q = await createEmbedding(opts.query)
  const vec = toPgVectorLiteral(q)

  const rows = await prisma.$queryRawUnsafe<Array<{ content: string }>>(
    `
    SELECT content
    FROM embeddings
    WHERE metadata->>'tenantId' = $1
      AND (
        metadata->>'agentId' IS NULL
        OR metadata->>'agentId' = $2
      )
    ORDER BY embedding <=> $3::vector
    LIMIT $4
    `,
    opts.tenantId,
    opts.agentId,
    vec,
    limit
  )

  if (!rows.length) return null
  return rows.map((r, i) => `${i + 1}. ${r.content}`).join('\n')
}

export async function ingestEmbeddingDocument(opts: {
  content: string
  metadata: Record<string, unknown>
}): Promise<void> {
  const text = opts.content.trim()
  if (!text) return

  const embedding = await createEmbedding(text)
  const vec = toPgVectorLiteral(embedding)
  const id = crypto.randomUUID()

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO embeddings (id, content, embedding, metadata, "createdAt")
    VALUES ($1, $2, $3::vector, $4::jsonb, NOW())
    `,
    id,
    text.slice(0, 12000),
    vec,
    JSON.stringify(opts.metadata)
  )
}
