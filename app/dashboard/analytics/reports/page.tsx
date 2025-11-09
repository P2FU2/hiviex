/**
 * Analytics Reports Page
 * 
 * Relatórios detalhados de analytics
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AnalyticsReportsPage() {
  const session = await getAuthSession()

  // Get user's workspaces
  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  // Get analytics data grouped by date
  const analytics = await (prisma as any).analytics.findMany({
    where: {
      tenantId: { in: tenantIds },
    },
    orderBy: { date: 'desc' },
    take: 100,
  })

  // Group by date
  const byDate = analytics.reduce((acc: any, item: any) => {
    const date = new Date(item.date).toLocaleDateString('pt-BR')
    if (!acc[date]) {
      acc[date] = {
        reach: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        revenue: 0,
        cost: 0,
      }
    }
    acc[date].reach += item.reach || 0
    acc[date].impressions += item.impressions || 0
    acc[date].clicks += Math.round((item.impressions || 0) * (item.ctr || 0) / 100)
    acc[date].leads += item.leads || 0
    acc[date].revenue += item.revenue || 0
    acc[date].cost += item.cost || 0
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/analytics"
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Relatórios de Analytics
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Relatórios detalhados e exportáveis
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity">
          <Download className="w-5 h-5" />
          Exportar
        </button>
      </div>

      {/* Reports */}
      <div className="space-y-6">
        {Object.entries(byDate).map(([date, stats]: [string, any]) => (
          <div
            key={date}
            className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  {date}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alcance</p>
                <p className="text-xl font-bold text-black dark:text-white">
                  {stats.reach.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Impressões</p>
                <p className="text-xl font-bold text-black dark:text-white">
                  {stats.impressions.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cliques</p>
                <p className="text-xl font-bold text-black dark:text-white">
                  {stats.clicks.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Leads</p>
                <p className="text-xl font-bold text-black dark:text-white">
                  {stats.leads.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receita</p>
                <p className="text-xl font-bold text-black dark:text-white">
                  R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
                <p
                  className={`text-xl font-bold ${
                    stats.cost > 0 && (stats.revenue - stats.cost) / stats.cost > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {stats.cost > 0
                    ? `${(((stats.revenue - stats.cost) / stats.cost) * 100).toFixed(1)}%`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ))}

        {Object.keys(byDate).length === 0 && (
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
              Nenhum relatório disponível
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Os relatórios aparecerão aqui quando houver dados de analytics
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

