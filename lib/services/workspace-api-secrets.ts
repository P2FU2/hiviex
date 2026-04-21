/**
 * Resolve segredos de API do workspace (cifrados em repouso).
 */

import { prisma } from '@/lib/db/prisma'
import { decrypt } from '@/lib/utils/encryption'

export async function getDecryptedWorkspaceApiSecret(
  tenantId: string,
  provider: string
): Promise<string | null> {
  const normalized = provider.toLowerCase().trim()
  const row = await prisma.workspaceApiKey.findFirst({
    where: { tenantId, provider: normalized },
    orderBy: { updatedAt: 'desc' },
  })
  if (!row) return null

  const secret = decrypt(row.encryptedSecret)
  if (!secret) return null

  prisma.workspaceApiKey
    .update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {})

  return secret
}
