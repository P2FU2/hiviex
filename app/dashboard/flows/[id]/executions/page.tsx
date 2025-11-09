/**
 * Flow Executions List Page
 * 
 * Lista execuções de um flow específico
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock, Play } from 'lucide-react'
export const dynamic = 'force-dynamic'

type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export default async function FlowExecutionsPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getAuthSession()

  // Get user's workspaces
  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  // Get flow
  const flow = await (prisma as any).flow.findFirst({
    where: {
      id: params.id,
      tenantId: { in: tenantIds },
    },
    select: {
      id: true,
      name: true,
    },
  })

  if (!flow) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Flow não encontrado</p>
        <Link
          href="/dashboard/flows"
          className="mt-4 inline-block text-black dark:text-white hover:underline"
        >
          Voltar para flows
        </Link>
      </div>
    )
  }

  // Get executions
  const executions = await (prisma as any).flowExecution.findMany({
    where: {
      flowId: params.id,
    },
    include: {
      nodeExecutions: {
        take: 3,
        orderBy: {
          startedAt: 'desc',
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
    take: 50,
  })

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

  const getStatusBadge = (status: ExecutionStatus) => {
    const statusClasses = {
      COMPLETED: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      FAILED: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      RUNNING: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      PENDING: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      CANCELLED: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
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
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/flows/${params.id}`}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Execuções: {flow.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Histórico de execuções deste flow
            </p>
          </div>
        </div>
      </div>

      {/* Executions List */}
      {executions.length === 0 ? (
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-12 text-center">
          <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
            Nenhuma execução ainda
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Execute este flow para ver o histórico aqui
          </p>
          <Link
            href={`/dashboard/flows/${params.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
          >
            <Play className="w-5 h-5" />
            Voltar para Flow
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {executions.map((execution: any) => (
            <Link
              key={execution.id}
              href={`/dashboard/flows/${params.id}/executions/${execution.id}`}
              className="block bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {getStatusIcon(execution.status)}
                  <div>
                    <h3 className="font-semibold text-lg text-black dark:text-white">
                      Execução #{execution.id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(execution.startedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                {getStatusBadge(execution.status)}
              </div>

              {execution.error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {execution.error}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                <span>{execution.nodeExecutions.length} nós executados</span>
                {execution.completedAt && (
                  <>
                    <span>•</span>
                    <span>
                      Duração:{' '}
                      {Math.round(
                        (new Date(execution.completedAt).getTime() -
                          new Date(execution.startedAt).getTime()) /
                          1000
                      )}{' '}
                      segundos
                    </span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

