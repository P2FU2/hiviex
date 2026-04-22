/**
 * Detalhe do influenciador — edição de versão, jobs, referências.
 */

import { getAuthSession } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { InfluencerDetailClient } from '@/components/dashboard/influencers/InfluencerDetailClient'

export const dynamic = 'force-dynamic'

export default async function InfluencerDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const session = await getAuthSession()
  const { id } = await Promise.resolve(params)

  const inf = await prisma.aIInfluencer.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        select: { id: true, version: true, status: true },
      },
    },
  })

  if (!inf) notFound()

  const allowed = await hasTenantPermission(session.user.id, inf.tenantId, 'MEMBER')
  if (!allowed) notFound()

  const canLock = await hasTenantPermission(session.user.id, inf.tenantId, 'ADMIN')

  return (
    <InfluencerDetailClient
      influencer={{
        id: inf.id,
        name: inf.name,
        slug: inf.slug,
        status: inf.status,
        tenantId: inf.tenantId,
        currentVersionId: inf.currentVersionId,
      }}
      versionSummaries={inf.versions}
      canLock={canLock}
    />
  )
}
