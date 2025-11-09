/**
 * Workflows Page
 * 
 * Gerenciar workflows (que contêm flows)
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Plus, Play, Pause, Archive, Settings, Trash2, GitBranch } from 'lucide-react'
import DeleteWorkflowButton from '@/components/DeleteWorkflowButton'
export const dynamic = 'force-dynamic'

type WorkflowStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED'

export default async function WorkflowsPage() {
  const session = await getAuthSession()

  // Get user's workspaces
  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  // Get all workflows
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

  const getStatusBadge = (status: WorkflowStatus) => {
    const statusClasses = {
      ACTIVE: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      PAUSED: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      ARCHIVED: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
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
            Workflows
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gerencie seus workflows e flows
          </p>
        </div>
        <Link
          href="/dashboard/workflows/new"
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Novo Workflow
        </Link>
      </div>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-12 text-center">
          <GitBranch className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
            Nenhum workflow criado ainda
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Crie seu primeiro workflow para começar
          </p>
          <Link
            href="/dashboard/workflows/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Criar Workflow
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow: any) => (
            <div
              key={workflow.id}
              className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
                    {workflow.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {workflow.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(workflow.status)}
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {workflow._count.agents} agente(s)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Link
                  href={`/dashboard/workflows/${workflow.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity text-sm"
                >
                  <Settings className="w-4 h-4" />
                  Configurar
                </Link>
                <Link
                  href={`/dashboard/flows?workflow=${workflow.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <GitBranch className="w-4 h-4" />
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
