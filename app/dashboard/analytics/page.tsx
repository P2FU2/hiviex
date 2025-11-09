/**
 * Analytics & Revenue Dashboard
 * 
 * Monitoramento contínuo de métricas e receita
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import { TrendingUp, Eye, MousePointerClick, Users, DollarSign, BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const session = await getAuthSession()

  // Get user's workspaces
  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  // Get analytics data (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const analytics = await (prisma as any).analytics.findMany({
    where: {
      tenantId: { in: tenantIds },
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: 'desc' },
  })

  // Calculate totals
  const totals = analytics.reduce(
    (acc: any, item: any) => ({
      reach: acc.reach + (item.reach || 0),
      impressions: acc.impressions + (item.impressions || 0),
      clicks: acc.clicks + Math.round((item.impressions || 0) * (item.ctr || 0) / 100),
      leads: acc.leads + (item.leads || 0),
      revenue: acc.revenue + (item.revenue || 0),
      cost: acc.cost + (item.cost || 0),
    }),
    { reach: 0, impressions: 0, clicks: 0, leads: 0, revenue: 0, cost: 0 }
  )

  const totalCTR = totals.impressions > 0 
    ? (totals.clicks / totals.impressions) * 100 
    : 0
  const totalROI = totals.cost > 0 
    ? ((totals.revenue - totals.cost) / totals.cost) * 100 
    : 0

  // Group by channel
  const byChannel = analytics.reduce((acc: any, item: any) => {
    const channel = item.channel || 'Outros'
    if (!acc[channel]) {
      acc[channel] = {
        reach: 0,
        impressions: 0,
        clicks: 0,
        leads: 0,
        revenue: 0,
        cost: 0,
      }
    }
    acc[channel].reach += item.reach || 0
    acc[channel].impressions += item.impressions || 0
    acc[channel].clicks += Math.round((item.impressions || 0) * (item.ctr || 0) / 100)
    acc[channel].leads += item.leads || 0
    acc[channel].revenue += item.revenue || 0
    acc[channel].cost += item.cost || 0
    return acc
  }, {})

  const channelStats = Object.entries(byChannel).map(([channel, stats]: [string, any]) => ({
    channel,
    ...stats,
    ctr: stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0,
    roi: stats.cost > 0 ? ((stats.revenue - stats.cost) / stats.cost) * 100 : 0,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Analytics & Revenue
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitoramento contínuo de métricas e receita
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-2xl font-bold text-black dark:text-white">
              {totals.reach.toLocaleString()}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Alcance Total
          </h3>
        </div>

        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <MousePointerClick className="w-8 h-8 text-green-600 dark:text-green-400" />
            <span className="text-2xl font-bold text-black dark:text-white">
              {totalCTR.toFixed(2)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            CTR Médio
          </h3>
        </div>

        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <span className="text-2xl font-bold text-black dark:text-white">
              {totals.leads.toLocaleString()}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Leads Capturados
          </h3>
        </div>

        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <span className="text-2xl font-bold text-black dark:text-white">
              R$ {totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Receita Total
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            ROI: {totalROI.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Channel Performance */}
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-black dark:text-white" />
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Performance por Canal
          </h2>
        </div>

        {channelStats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum dado de analytics disponível ainda
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200/50 dark:border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Canal
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Alcance
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Impressões
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    CTR
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Leads
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Receita
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody>
                {channelStats.map((stat: any, idx: number) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-200/50 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <td className="py-3 px-4 text-sm text-black dark:text-white font-medium">
                      {stat.channel}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {stat.reach.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {stat.impressions.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {stat.ctr.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {stat.leads.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-right">
                      R$ {stat.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span
                        className={
                          stat.roi >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {stat.roi.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

