/**
 * Analytics Metrics Page
 * 
 * Métricas detalhadas e comparações
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AnalyticsMetricsPage() {
  const session = await getAuthSession()

  // Get user's workspaces
  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  // Get analytics for last 30 days and previous 30 days for comparison
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date(now)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const [currentPeriod, previousPeriod] = await Promise.all([
    (prisma as any).analytics.findMany({
      where: {
        tenantId: { in: tenantIds },
        date: { gte: thirtyDaysAgo, lt: now },
      },
    }),
    (prisma as any).analytics.findMany({
      where: {
        tenantId: { in: tenantIds },
        date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),
  ])

  const calculateTotals = (data: any[]) => {
    return data.reduce(
      (acc, item) => ({
        reach: acc.reach + (item.reach || 0),
        impressions: acc.impressions + (item.impressions || 0),
        clicks: acc.clicks + Math.round((item.impressions || 0) * (item.ctr || 0) / 100),
        leads: acc.leads + (item.leads || 0),
        revenue: acc.revenue + (item.revenue || 0),
        cost: acc.cost + (item.cost || 0),
      }),
      { reach: 0, impressions: 0, clicks: 0, leads: 0, revenue: 0, cost: 0 }
    )
  }

  const current = calculateTotals(currentPeriod)
  const previous = calculateTotals(previousPeriod)

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const metrics = [
    {
      name: 'Alcance',
      current: current.reach,
      previous: previous.reach,
      format: (v: number) => v.toLocaleString(),
    },
    {
      name: 'Impressões',
      current: current.impressions,
      previous: previous.impressions,
      format: (v: number) => v.toLocaleString(),
    },
    {
      name: 'Cliques',
      current: current.clicks,
      previous: previous.clicks,
      format: (v: number) => v.toLocaleString(),
    },
    {
      name: 'Leads',
      current: current.leads,
      previous: previous.leads,
      format: (v: number) => v.toLocaleString(),
    },
    {
      name: 'Receita',
      current: current.revenue,
      previous: previous.revenue,
      format: (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    },
    {
      name: 'ROI',
      current: current.cost > 0 ? ((current.revenue - current.cost) / current.cost) * 100 : 0,
      previous: previous.cost > 0 ? ((previous.revenue - previous.cost) / previous.cost) * 100 : 0,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
  ]

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
              Métricas Detalhadas
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Comparação de períodos e tendências
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const change = calculateChange(metric.current, metric.previous)
          const isPositive = change > 0
          const isNegative = change < 0

          return (
            <div
              key={metric.name}
              className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6"
            >
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                {metric.name}
              </h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-black dark:text-white">
                    {metric.format(metric.current)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {isPositive && (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                    {isNegative && (
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                    {!isPositive && !isNegative && (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        isPositive
                          ? 'text-green-600 dark:text-green-400'
                          : isNegative
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {change > 0 ? '+' : ''}
                      {change.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      vs período anterior
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-white/10">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Período anterior: {metric.format(metric.previous)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

