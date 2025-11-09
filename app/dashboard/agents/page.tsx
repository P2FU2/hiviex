/**
 * Agents List Page
 * 
 * Lists all agents across user's workspaces
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Plus, Bot, Edit, Trash2, MessageSquare, Settings } from 'lucide-react'
import DeleteAgentButton from '@/components/DeleteAgentButton'
export const dynamic = 'force-dynamic'

type AgentStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT'

export default async function AgentsPage() {
  const session = await getAuthSession()

  // Get user's workspaces
  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  // Get all agents from user's workspaces
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

  // Group agents by workspace
  const agentsByWorkspace = tenantMemberships.map((membership: any) => {
    const workspaceAgents = agents.filter(
      (agent) => agent.tenantId === membership.tenant.id
    )
    return {
      workspace: membership.tenant,
      agents: workspaceAgents,
      role: membership.role,
    }
  })

  const getStatusBadge = (status: AgentStatus) => {
    const statusClasses = {
      ACTIVE: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      INACTIVE: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
      DRAFT: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    }
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status]}`}
      >
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Agents
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gerencie seus agentes de IA em todos os workspaces
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/agents/library"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity"
          >
            <Bot className="w-5 h-5" />
            Biblioteca
          </Link>
          <Link
            href="/dashboard/agents/new"
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Novo Agente
          </Link>
        </div>
      </div>

      {/* Agents by Workspace */}
      {agentsByWorkspace.length === 0 || agents.length === 0 ? (
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-12 text-center">
          <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
            No agents yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first AI agent to get started
          </p>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Create Agent
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {agentsByWorkspace.map(({ workspace, agents: workspaceAgents, role }) => {
            if (workspaceAgents.length === 0) return null

            return (
              <div
                key={workspace.id}
                className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                      {workspace.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {workspaceAgents.length} agent{workspaceAgents.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/workspaces/${workspace.id}`}
                    className="text-sm text-black dark:text-white hover:underline"
                  >
                    View workspace
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workspaceAgents.map((agent: any) => (
                    <div
                      key={agent.id}
                      className="p-4 border border-gray-200/50 dark:border-white/10 rounded-lg hover:border-black dark:hover:border-white transition-colors bg-white/50 dark:bg-black/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-black dark:text-white">
                              {agent.name}
                            </h3>
                            {getStatusBadge(agent.status)}
                          </div>
                        </div>
                      </div>

                      {agent.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {agent.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-3">
                        <span>{agent.provider}</span>
                        <span>•</span>
                        <span>{agent.model}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-gray-200/50 dark:border-white/10">
                        <Link
                          href={`/dashboard/agents/${agent.id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-black dark:text-white"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Chat
                        </Link>
                        <Link
                          href={`/dashboard/agents/${agent.id}/edit`}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <DeleteAgentButton agentId={agent.id} agentName={agent.name} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

