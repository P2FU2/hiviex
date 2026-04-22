/**
 * Dashboard Home Page
 *
 * Overview page with statistics and quick actions
 */

import { getAuthSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserTenants } from '@/lib/utils/tenant'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Plus, Users, Bot, Workflow, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { Card } from '@/components/ui/Card'
import { dashBtnPrimary, dashInteractiveCard, dashLink } from '@/lib/dashboard-ui'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getAuthSession()

  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  const [workspacesCount, agentsCount, messagesCount, workflowsCount, flowsCount] =
    await Promise.all([
      prisma.tenant.count({
        where: { id: { in: tenantIds } },
      }),
      prisma.agent.count({
        where: { tenantId: { in: tenantIds } },
      }),
      prisma.message.count({
        where: { tenantId: { in: tenantIds } },
      }),
      prisma.workflow.count({
        where: { tenantId: { in: tenantIds } },
      }),
      prisma.flow.count({
        where: { tenantId: { in: tenantIds } },
      }),
    ])

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        description={`Bem-vindo de volta, ${session.user?.name || session.user?.email || 'utilizador'}. Resumo da sua atividade nos workspaces.`}
      >
        <Link href="/dashboard/workspaces/new" className={dashBtnPrimary}>
          <Plus className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          Novo workspace
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        <StatCard
          title="Workspaces"
          value={workspacesCount}
          icon={Users}
          href="/dashboard/workspaces"
        />
        <StatCard
          title="Agentes"
          value={agentsCount}
          icon={Bot}
          href="/dashboard/agents"
        />
        <StatCard
          title="Mensagens"
          value={messagesCount}
          icon={TrendingUp}
          href="/dashboard/chat"
        />
        <StatCard
          title="Flows e workflows"
          value={workflowsCount + flowsCount}
          icon={Workflow}
          href="/dashboard/flows"
        />
      </div>

      <Card padding="lg">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title text-[var(--text-primary)]">Os seus workspaces</h2>
          <Link href="/dashboard/workspaces" className={dashLink}>
            Ver todos
          </Link>
        </div>
        {tenantMemberships.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Ainda sem workspaces"
            description="Crie o primeiro workspace para organizar agentes, fluxos e integrações."
            action={
              <Link href="/dashboard/workspaces/new" className={dashBtnPrimary}>
                <Plus className="h-5 w-5" strokeWidth={1.75} />
                Criar workspace
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {tenantMemberships.slice(0, 6).map((membership: any) => (
              <Link
                key={membership.tenant.id}
                href={`/dashboard/workspaces/${membership.tenant.id}`}
                className={dashInteractiveCard}
              >
                <h3 className="font-medium text-[var(--text-primary)]">{membership.tenant.name}</h3>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">{membership.role}</p>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string
  value: number
  icon: LucideIcon
  href: string
}) {
  return (
    <Link href={href} className={`${dashInteractiveCard} block p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[var(--text-primary)]">
            {value}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </Link>
  )
}
