/**
 * Flow Builder - Canvas Visual de Fluxos
 * 
 * Interface principal para criar e gerenciar flows visuais
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Plus, Play, Pause, Archive, Settings, Trash2 } from 'lucide-react'
import type { FlowStatus } from '@/lib/types/domain'

export const dynamic = 'force-dynamic'

export default async function FlowsPage() {
  const session = await getAuthSession()

  // Get user's workspaces
  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  // Get all flows from user's workspaces
  const flows = await (prisma as any).flow.findMany({
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
      nodes: {
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          executions: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const getStatusBadge = (status: FlowStatus) => {
    const statusClasses = {
      ACTIVE: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      PAUSED: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      ARCHIVED: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
      DRAFT: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
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
            Flow Builder
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Crie pipelines visuais conectando agentes e processos
          </p>
        </div>
        <Link
          href="/dashboard/flows/new"
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Novo Flow
        </Link>
      </div>

      {/* Flows List */}
      {flows.length === 0 ? (
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
            Nenhum flow criado ainda
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Crie seu primeiro flow visual para começar
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
            <div
              key={flow.id}
              className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-black dark:text-white mb-2">
                    {flow.name}
                  </h3>
                  {getStatusBadge(flow.status)}
                </div>
              </div>

              {flow.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {flow.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-4">
                <span>{flow.nodes.length} nós</span>
                <span>•</span>
                <span>{flow._count.executions} execuções</span>
                <span>•</span>
                <span>{flow.tenant.name}</span>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200/50 dark:border-white/10">
                <Link
                  href={`/dashboard/flows/${flow.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-black dark:text-white"
                >
                  <Play className="w-4 h-4" />
                  Abrir
                </Link>
                <button
                  onClick={() => {
                    // Abrir configurações no próprio canvas
                    window.location.href = `/dashboard/flows/${flow.id}?tab=settings`
                  }}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  title="Configurações"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

