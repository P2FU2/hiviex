/**
 * Workflow Detail Page
 * 
 * Configurar workflow e seus flows
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { ArrowLeft, Plus, GitBranch, Bot } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function WorkflowDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getAuthSession()

  // Get user's workspaces
  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  // Get workflow
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: params.id,
      tenantId: { in: tenantIds },
    },
    include: {
      agents: {
        include: {
          agent: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  if (!workflow) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Workflow não encontrado</p>
        <Link
          href="/dashboard/workflows"
          className="mt-4 inline-block text-black dark:text-white hover:underline"
        >
          Voltar para workflows
        </Link>
      </div>
    )
  }

  // Get flows for this workflow
  const flows = await (prisma as any).flow.findMany({
    where: {
      tenantId: workflow.tenantId,
      // In production, add workflowId to Flow model
    },
    include: {
      _count: {
        select: {
          nodes: true,
          executions: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/workflows"
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              {workflow.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {workflow.description || 'Sem descrição'}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/flows/new"
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Novo Flow
        </Link>
      </div>

      {/* Flows Section */}
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
          Flows neste Workflow
        </h2>
        {flows.length === 0 ? (
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-12 text-center">
            <GitBranch className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Nenhum flow ainda
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Crie flows para este workflow
            </p>
            <Link
              href="/dashboard/flows/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Criar Flow
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flows.map((flow: any) => (
              <Link
                key={flow.id}
                href={`/dashboard/flows/${flow.id}`}
                className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
                      {flow.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {flow.description || 'Sem descrição'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                  <span>{flow._count.nodes} nós</span>
                  <span>•</span>
                  <span>{flow._count.executions} execuções</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Agents Section */}
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
          Agentes no Workflow
        </h2>
        {workflow.agents.length === 0 ? (
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-8 text-center">
            <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum agente configurado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflow.agents.map((wa: any, idx: number) => (
              <div
                key={wa.id}
                className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-black dark:text-white">
                      {wa.agent.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Ordem: {wa.order}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

