/**
 * Flow Execution Detail Page
 * 
 * Detalhes completos de uma execução com logs
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock, Play } from 'lucide-react'
import { ExecutionStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function FlowExecutionDetailPage({
  params,
}: {
  params: { id: string; executionId: string }
}) {
  const session = await getAuthSession()

  // Get user's workspaces
  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  // Get execution
  const execution = await prisma.flowExecution.findFirst({
    where: {
      id: params.executionId,
      flowId: params.id,
    },
    include: {
      flow: {
        select: {
          id: true,
          name: true,
        },
      },
      nodeExecutions: {
        orderBy: {
          startedAt: 'asc',
        },
      },
    },
  })

  if (!execution) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Execução não encontrada</p>
        <Link
          href="/dashboard/flows/executions"
          className="mt-4 inline-block text-black dark:text-white hover:underline"
        >
          Voltar para execuções
        </Link>
      </div>
    )
  }

  // Check access
  const flow = await prisma.flow.findFirst({
    where: {
      id: params.id,
      tenantId: { in: tenantIds },
    },
  })

  if (!flow) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Acesso negado</p>
      </div>
    )
  }

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
      case 'RUNNING':
        return <Play className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
    }
  }

  const logs = Array.isArray(execution.logs) ? execution.logs : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/flows/executions"
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Execução: {execution.flow.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {new Date(execution.startedAt).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
        {getStatusIcon(execution.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Node Executions */}
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
              Execuções de Nós
            </h2>
            <div className="space-y-4">
              {execution.nodeExecutions.map((nodeExec) => (
                <div
                  key={nodeExec.id}
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-black dark:text-white">
                      {nodeExec.nodeId}
                    </span>
                    {getStatusIcon(nodeExec.status)}
                  </div>
                  {nodeExec.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
                      {nodeExec.error}
                    </div>
                  )}
                  {nodeExec.output && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(nodeExec.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Logs */}
          {logs.length > 0 && (
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
                Logs de Execução
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-sm ${
                      log.level === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : log.level === 'warning'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                        : log.level === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-60">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                      </span>
                      <span className="font-medium">{log.nodeLabel || 'System'}</span>
                    </div>
                    <p className="mt-1">{log.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
            <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
              Status
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <p className="text-lg font-bold text-black dark:text-white mt-1">
                  {execution.status}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Iniciado:</span>
                <p className="text-sm text-black dark:text-white mt-1">
                  {new Date(execution.startedAt).toLocaleString('pt-BR')}
                </p>
              </div>
              {execution.completedAt && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Concluído:</span>
                  <p className="text-sm text-black dark:text-white mt-1">
                    {new Date(execution.completedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
              {execution.completedAt && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Duração:</span>
                  <p className="text-sm text-black dark:text-white mt-1">
                    {Math.round(
                      (new Date(execution.completedAt).getTime() -
                        new Date(execution.startedAt).getTime()) /
                        1000
                    )}{' '}
                    segundos
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Output */}
          {execution.output && (
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
                Output
              </h2>
              <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
                {JSON.stringify(execution.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

