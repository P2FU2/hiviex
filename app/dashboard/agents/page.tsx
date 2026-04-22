/**
 * Agents List Page
 *
 * Lists all agents across user's workspaces
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Plus, Bot, Edit, MessageSquare, Settings } from 'lucide-react'
import DeleteAgentButton from '@/components/DeleteAgentButton'
import type { AgentStatus } from '@/lib/types/domain'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import {
  dashBtnPrimary,
  dashBtnSecondary,
  dashBtnGhost,
  dashInteractiveCard,
  dashLink,
} from '@/lib/dashboard-ui'

export const dynamic = 'force-dynamic'

function agentStatusVariant(status: AgentStatus): BadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'INACTIVE':
      return 'neutral'
    case 'DRAFT':
    default:
      return 'warning'
  }
}

export default async function AgentsPage() {
  const session = await getAuthSession()

  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  const agents = await prisma.agent.findMany({
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
    },
    orderBy: { createdAt: 'desc' },
  })

  const agentsByWorkspace = tenantMemberships.map((membership: any) => {
    const workspaceAgents = agents.filter((agent) => agent.tenantId === membership.tenant.id)
    return {
      workspace: membership.tenant,
      agents: workspaceAgents,
      role: membership.role,
    }
  })

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="IA operacional"
        title="Agentes"
        description="Gerir agentes por workspace — modelo, estado e acesso rápido ao chat."
      >
        <Link href="/dashboard/agents/library" className={dashBtnSecondary}>
          <Bot className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          Biblioteca
        </Link>
        <Link href="/dashboard/agents/new" className={dashBtnPrimary}>
          <Plus className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          Novo agente
        </Link>
      </PageHeader>

      {agentsByWorkspace.length === 0 || agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Ainda sem agentes"
          description="Crie um agente alinhado à voz da marca ou importe um modelo da biblioteca."
          action={
            <Link href="/dashboard/agents/new" className={dashBtnPrimary}>
              <Plus className="h-5 w-5" strokeWidth={1.75} />
              Criar agente
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {agentsByWorkspace.map(({ workspace, agents: workspaceAgents }) => {
            if (workspaceAgents.length === 0) return null

            return (
              <Card key={workspace.id} padding="lg">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-title text-[var(--text-primary)]">{workspace.name}</h2>
                    <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                      {workspaceAgents.length}{' '}
                      {workspaceAgents.length === 1 ? 'agente' : 'agentes'}
                    </p>
                  </div>
                  <Link href={`/dashboard/workspaces/${workspace.id}`} className={dashLink}>
                    Abrir workspace
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {workspaceAgents.map((agent: any) => (
                    <div key={agent.id} className={dashInteractiveCard}>
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
                            <Bot className="h-5 w-5" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-medium text-[var(--text-primary)]">
                              {agent.name}
                            </h3>
                            <div className="mt-1">
                              <Badge variant={agentStatusVariant(agent.status)}>{agent.status}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {agent.description ? (
                        <p className="mb-3 line-clamp-2 text-sm text-[var(--text-secondary)]">
                          {agent.description}
                        </p>
                      ) : null}

                      <p className="mb-4 text-xs text-[var(--text-tertiary)]">
                        {agent.provider} · {agent.model}
                      </p>

                      <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
                        <Link
                          href={`/dashboard/agents/${agent.id}`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-premium hover:border-[var(--border-strong)]"
                        >
                          <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
                          Chat
                        </Link>
                        <Link
                          href={`/dashboard/agents/${agent.id}/edit`}
                          className={dashBtnGhost}
                          title="Editar"
                          aria-label={`Editar ${agent.name}`}
                        >
                          <Edit className="h-4 w-4" strokeWidth={1.75} />
                        </Link>
                        <DeleteAgentButton agentId={agent.id} agentName={agent.name} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
