/**
 * Workspace Detail Page
 * 
 * Shows workspace details, agents, and settings
 */

import { getAuthSession } from '@/lib/auth/session'
import { getTenantWithUser, hasTenantPermission } from '@/lib/utils/tenant'
import type { TenantRole } from '@/lib/types/domain'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Settings, Bot, MessageSquare, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WorkspaceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getAuthSession()

  const membership = await getTenantWithUser(params.id, session.user.id)

  if (!membership) {
    notFound()
  }

  // Check permission
  const hasAccess = await hasTenantPermission(
    session.user.id,
    params.id,
    'MEMBER'
  )

  if (!hasAccess) {
    redirect('/dashboard/workspaces')
  }

  // Get workspace stats
  const [agentsCount, messagesCount, membersCount] = await Promise.all([
    prisma.agent.count({
      where: { tenantId: params.id },
    }),
    prisma.message.count({
      where: { tenantId: params.id },
    }),
    (prisma as any).tenantUser.count({
      where: { tenantId: params.id },
    }),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {membership.tenant.name}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {membership.tenant.slug}
          </p>
        </div>
        {(membership.role === 'OWNER' || membership.role === 'ADMIN') && (
          <Link
            href={`/dashboard/workspaces/${params.id}/settings`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Agents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {agentsCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Messages</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {messagesCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {membersCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/dashboard/agents?workspace=${params.id}`}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Create Agent
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Build a new AI agent
            </p>
          </Link>
          <Link
            href={`/dashboard/chat?workspace=${params.id}`}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Start Chat
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Chat with your agents
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}

