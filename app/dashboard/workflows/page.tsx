/**
 * Workflows Page
 *
 * Gerenciar workflows (que contêm flows)
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Plus, Settings, GitBranch } from 'lucide-react'
import DeleteWorkflowButton from '@/components/DeleteWorkflowButton'
import type { WorkflowStatus } from '@/lib/types/domain'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { dashBtnPrimary, dashBtnSecondary, dashInteractiveCard } from '@/lib/dashboard-ui'

export const dynamic = 'force-dynamic'

function workflowStatusVariant(status: WorkflowStatus): BadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'PAUSED':
      return 'warning'
    case 'ARCHIVED':
    default:
      return 'neutral'
  }
}

export default async function WorkflowsPage() {
  const session = await getAuthSession()

  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  const workflows = await prisma.workflow.findMany({
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
      agents: {
        include: {
          agent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          agents: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Orquestração"
        title="Workflows"
        description="Agrupe agentes e ligue-os a flows — um único sítio para estado e configuração."
      >
        <Link href="/dashboard/workflows/new" className={dashBtnPrimary}>
          <Plus className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          Novo workflow
        </Link>
      </PageHeader>

      {workflows.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="Nenhum workflow"
          description="Defina um workflow antes de escalar automações entre equipas e workspaces."
          action={
            <Link href="/dashboard/workflows/new" className={dashBtnPrimary}>
              <Plus className="h-5 w-5" strokeWidth={1.75} />
              Criar workflow
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow: any) => (
            <div key={workflow.id} className={`${dashInteractiveCard} flex flex-col`}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{workflow.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
                  {workflow.description || 'Sem descrição'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={workflowStatusVariant(workflow.status)}>{workflow.status}</Badge>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {workflow._count.agents} agente(s)
                  </span>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-4">
                <Link
                  href={`/dashboard/workflows/${workflow.id}`}
                  className="inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-premium hover:opacity-92"
                >
                  <Settings className="h-4 w-4" strokeWidth={1.75} />
                  Configurar
                </Link>
                <Link
                  href={`/dashboard/flows?workflow=${workflow.id}`}
                  className={`${dashBtnSecondary} flex-1 min-w-[120px]`}
                >
                  <GitBranch className="h-4 w-4" strokeWidth={1.75} />
                  Flows
                </Link>
                <DeleteWorkflowButton workflowId={workflow.id} workflowName={workflow.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
