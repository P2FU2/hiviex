'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

type TenantOpt = { id: string; name: string }

type Plan = {
  id: string
  name: string
  price: number
  features: string[]
}

type Props = {
  stripeReady: boolean
  tenants: TenantOpt[]
  defaultTenantId: string
  plans: Plan[]
}

export default function BillingPlanActions({
  stripeReady,
  tenants,
  defaultTenantId,
  plans,
}: Props) {
  const [tenantId, setTenantId] = useState(defaultTenantId)
  const [loading, setLoading] = useState<string | null>(null)

  const openCheckout = async (
    planType: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  ) => {
    if (!tenantId) {
      alert('Selecione um workspace.')
      return
    }
    setLoading(planType)
    try {
      const r = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, planType }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Falha no checkout')
      window.location.href = data.url as string
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(null)
    }
  }

  const openPortal = async () => {
    if (!tenantId) {
      alert('Selecione um workspace.')
      return
    }
    setLoading('portal')
    try {
      const r = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Falha ao abrir portal')
      window.location.href = data.url as string
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {tenants.length > 0 ? (
        <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/60 dark:bg-black/40 px-4 py-3 max-w-md">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Workspace para faturação
          </label>
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-black dark:text-white"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Apenas administradores do workspace podem subscrever ou abrir o portal
            Stripe.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void openPortal()}
          disabled={!stripeReady || !tenantId || loading !== null}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
        >
          {loading === 'portal' ? 'A abrir…' : 'Gerir faturação e cartão'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isPopular = plan.id === 'PROFESSIONAL'
          const paid =
            plan.id === 'STARTER' ||
            plan.id === 'PROFESSIONAL' ||
            plan.id === 'ENTERPRISE'
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
              {plan.price === 0 ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-lg font-medium bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                >
                  Plano incluído
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    !stripeReady || !tenantId || loading !== null || !paid
                  }
                  onClick={() =>
                    void openCheckout(plan.id as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE')
                  }
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80 disabled:opacity-50'
                  }`}
                >
                  {!stripeReady
                    ? 'Stripe não configurado'
                    : loading === plan.id
                      ? 'A redirecionar…'
                      : 'Subscrever'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
