/**
 * Dashboard Home Page
 * 
 * Overview page with statistics and quick actions
 */

import { getAuthSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserTenants } from '@/lib/utils/tenant'
import Link from 'next/link'
import { Plus, Users, Bot, Workflow, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getAuthSession()
  // getAuthSession guarantees session.user.id exists

  // Get user's workspaces
  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  // Get statistics
  const [workspacesCount, agentsCount, messagesCount] = await Promise.all([
    prisma.tenant.count({
      where: { id: { in: tenantIds } },
    }),
    prisma.agent.count({
      where: { tenantId: { in: tenantIds } },
    }),
    prisma.message.count({
      where: { tenantId: { in: tenantIds } },
    }),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {session.user?.name || session.user?.email || 'User'}
          </p>
        </div>
        <Link
          href="/dashboard/workspaces/new"
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          New Workspace
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Workspaces"
          value={workspacesCount}
          icon={Users}
          href="/dashboard/workspaces"
          color="blue"
        />
        <StatCard
          title="Agents"
          value={agentsCount}
          icon={Bot}
          href="/dashboard/agents"
          color="green"
        />
        <StatCard
          title="Messages"
          value={messagesCount}
          icon={TrendingUp}
          href="/dashboard/chat"
          color="purple"
        />
        <StatCard
          title="Workflows"
          value={0}
          icon={Workflow}
          href="/dashboard/workflows"
          color="orange"
        />
      </div>

      {/* Recent Workspaces */}
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Your Workspaces
          </h2>
          <Link
            href="/dashboard/workspaces"
            className="text-black dark:text-white hover:underline"
          >
            View all
          </Link>
        </div>
        {tenantMemberships.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have any workspaces yet
            </p>
            <Link
              href="/dashboard/workspaces/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Create Workspace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenantMemberships.slice(0, 6).map((membership: any) => (
              <Link
                key={membership.tenant.id}
                href={`/dashboard/workspaces/${membership.tenant.id}`}
                className="p-4 border border-gray-200/50 dark:border-white/10 rounded-lg hover:border-black dark:hover:border-white transition-colors bg-white/50 dark:bg-black/50"
              >
                <h3 className="font-semibold text-black dark:text-white mb-1">
                  {membership.tenant.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {membership.role}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  color,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  }

  return (
    <Link
      href={href}
      className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-black dark:text-white mt-2">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Link>
  )
}

