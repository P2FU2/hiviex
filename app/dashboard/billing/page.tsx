/**
 * Billing Page
 * 
 * Gerenciar assinaturas, planos e pagamentos
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants } from '@/lib/utils/tenant'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { CreditCard, Check, X, ArrowRight, Zap } from 'lucide-react'
import { PlanType, SubscriptionStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    features: [
      '100 requisições/mês',
      '1 workspace',
      '3 agentes',
      'Suporte por email',
    ],
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: 29,
    features: [
      '1.000 requisições/mês',
      '3 workspaces',
      '10 agentes',
      'Flow Builder',
      'Suporte prioritário',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: 99,
    features: [
      '10.000 requisições/mês',
      'Workspaces ilimitados',
      'Agentes ilimitados',
      'Flow Builder avançado',
      'Analytics completo',
      'Suporte 24/7',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 299,
    features: [
      'Requisições ilimitadas',
      'Workspaces ilimitados',
      'Agentes ilimitados',
      'Todas as funcionalidades',
      'API dedicada',
      'Suporte dedicado',
      'SLA garantido',
    ],
  },
]

export default async function BillingPage() {
  const session = await getAuthSession()

  // Get user's workspaces
  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: any) => tm.tenantId)

  // Get subscriptions
  const subscriptions = await (prisma as any).subscription.findMany({
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
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Billing & Subscription
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gerencie suas assinaturas e planos
        </p>
      </div>

      {/* Current Subscriptions */}
      {subscriptions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Assinaturas Ativas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white">
                      {sub.tenant.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Plano: {sub.planType}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sub.status === 'ACTIVE'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Requisições:
                    </span>
                    <span className="text-black dark:text-white font-medium">
                      {sub.monthlyRequests} / {sub.monthlyRequestsLimit}
                    </span>
                  </div>
                  {sub.currentPeriodEnd && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Próxima cobrança:
                      </span>
                      <span className="text-black dark:text-white">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
          Escolha seu Plano
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const isPopular = plan.id === 'PROFESSIONAL'
            return (
              <div
                key={plan.id}
                className={`relative bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border ${
                  isPopular
                    ? 'border-blue-500 dark:border-blue-400 shadow-xl'
                    : 'border-gray-200/50 dark:border-white/10'
                } shadow-lg p-6`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                      Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-black dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-black dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/mês</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80'
                  }`}
                >
                  {plan.price === 0 ? 'Plano Atual' : 'Assinar'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
          Métodos de Pagamento
        </h2>
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-black dark:text-white">
                  Nenhum método de pagamento
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Adicione um cartão para assinar um plano
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity text-sm">
              Adicionar Cartão
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
