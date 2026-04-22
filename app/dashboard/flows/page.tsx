/**
 * Flow Builder - Canvas Visual de Fluxos
 *
 * Interface principal para criar e gerenciar flows visuais
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Plus, Play, Settings, GitBranch } from 'lucide-react'
import type { FlowStatus } from '@/lib/types/domain'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { dashBtnPrimary, dashBtnGhost, dashInteractiveCard } from '@/lib/dashboard-ui'

export const dynamic = 'force-dynamic'

function flowStatusVariant(status: FlowStatus): BadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'PAUSED':
      return 'warning'
    case 'ARCHIVED':
      return 'neutral'
    case 'DRAFT':
    default:
      return 'info'
  }
}

export default async function FlowsPage() {
  const session = await getAuthSession()

  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  const flows = await (prisma as any).flow.findMany({
    where: {
      tenantId: { in: tenantIds },
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
      nodes: {
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          executions: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Automação"
        title="Flow Builder"
        description="Pipelines visuais que ligam agentes e processos — claro, auditável e fácil de iterar."
      >
        <Link href="/dashboard/flows/new" className={dashBtnPrimary}>
          <Plus className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          Novo flow
        </Link>
      </PageHeader>

      {flows.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="Nenhum flow criado"
          description="Comece por um flow simples e evolua com nós, condições e integrações."
          action={
            <Link href="/dashboard/flows/new" className={dashBtnPrimary}>
              <Plus className="h-5 w-5" strokeWidth={1.75} />
              Criar flow
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow: any) => (
            <div key={flow.id} className={`${dashInteractiveCard} flex flex-col`}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)]">{flow.name}</h3>
                  <div className="mt-2">
                    <Badge variant={flowStatusVariant(flow.status)}>{flow.status}</Badge>
                  </div>
                </div>
              </div>

              {flow.description ? (
                <p className="mb-4 line-clamp-2 text-sm text-[var(--text-secondary)]">
                  {flow.description}
                </p>
              ) : null}

              <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-tertiary)]">
                <span>{flow.nodes.length} nós</span>
                <span aria-hidden>·</span>
                <span>{flow._count.executions} execuções</span>
                <span aria-hidden>·</span>
                <span className="truncate">{flow.tenant.name}</span>
              </div>

              <div className="mt-auto flex items-center gap-2 border-t border-[var(--border-subtle)] pt-4">
                <Link
                  href={`/dashboard/flows/${flow.id}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-premium hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]"
                >
                  <Play className="h-4 w-4" strokeWidth={1.75} />
                  Abrir
                </Link>
                <Link
                  href={`/dashboard/flows/${flow.id}?tab=settings`}
                  className={dashBtnGhost}
                  title="Configurações"
                  aria-label="Configurações do flow"
                >
                  <Settings className="h-4 w-4" strokeWidth={1.75} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
