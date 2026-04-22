/**
 * Carrega versão de influenciador e valida membership no tenant.
 */

import { hasTenantPermission } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import type { AIInfluencerVersion, AIInfluencer } from '@prisma/client'

export type InfluencerVersionWithTenant = AIInfluencerVersion & {
  influencer: Pick<AIInfluencer, 'id' | 'tenantId'>
}

export async function getInfluencerVersionForUser(
  userId: string,
  influencerId: string,
  versionId: string
): Promise<
  | { ok: true; row: InfluencerVersionWithTenant }
  | { ok: false; error: 'NOT_FOUND' | 'FORBIDDEN' }
> {
  const row = await prisma.aIInfluencerVersion.findFirst({
    where: { id: versionId, influencerId },
    include: {
      influencer: { select: { id: true, tenantId: true } },
    },
  })
  if (!row) return { ok: false, error: 'NOT_FOUND' }
  const allowed = await hasTenantPermission(userId, row.influencer.tenantId, 'MEMBER')
  if (!allowed) return { ok: false, error: 'FORBIDDEN' }
  return { ok: true, row }
}
