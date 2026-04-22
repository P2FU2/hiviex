/**
 * Billing Page
 *
 * Planos, Stripe Checkout e Customer Portal.
 */

import { getAuthSession } from '@/lib/auth/session'
import { getUserTenants, hasTenantPermission } from '@/lib/utils/tenant'
import { TenantRole } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { isStripeConfigured } from '@/lib/billing/stripe-client'
import { ensureSubscriptionForTenant } from '@/lib/billing/ensure-subscription'
import BillingPlanActions from '@/components/billing/BillingPlanActions'
import { BILLING_PLANS } from '@/lib/billing/plans-catalog'

export const dynamic = 'force-dynamic'

const PLANS = BILLING_PLANS.map((p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  features: [...p.features],
}))

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}) {
  const session = await getAuthSession()
  const sp = await Promise.resolve(searchParams)
  const success = sp.success === '1'
  const canceled = sp.canceled === '1'

  const tenantMemberships = await getUserTenants(session.user.id)
  const tenantIds = tenantMemberships.map((tm: { tenantId: string }) => tm.tenantId)

  await Promise.all(tenantIds.map((id: string) => ensureSubscriptionForTenant(id)))

  const subscriptions = await prisma.subscription.findMany({
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

  const billableTenants: { id: string; name: string }[] = []
  for (const m of tenantMemberships) {
    const ok = await hasTenantPermission(
      session.user.id,
      m.tenantId,
      TenantRole.ADMIN
    )
    if (ok) {
      billableTenants.push({ id: m.tenant.id, name: m.tenant.name })
    }
  }

  const stripeReady = isStripeConfigured()
  const defaultTenantId = billableTenants[0]?.id ?? ''

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Billing & Subscription
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gerencie assinaturas com Stripe (Checkout e portal do cliente).
        </p>
      </div>

      {success ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          Pagamento iniciado com sucesso. O plano atualiza em instantes quando o
          Stripe confirmar a subscrição.
        </div>
      ) : null}
      {canceled ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Checkout cancelado. Pode voltar a subscrever quando quiser.
        </div>
      ) : null}

      {!stripeReady ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <strong>Modo demonstração:</strong> defina{' '}
          <code className="text-xs bg-black/10 dark:bg-white/10 px-1 rounded">
            STRIPE_SECRET_KEY
          </code>{' '}
          e os Price IDs no servidor para ativar pagamentos. Veja{' '}
          <code className="text-xs bg-black/10 dark:bg-white/10 px-1 rounded">
            .env.example
          </code>
          .
        </div>
      ) : null}

      {subscriptions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Estado por workspace
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
                      Requisições (mês):
                    </span>
                    <span className="text-black dark:text-white font-medium">
                      {sub.monthlyRequests} / {sub.monthlyRequestsLimit}
                    </span>
                  </div>
                  {sub.currentPeriodEnd && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Fim do período:
                      </span>
                      <span className="text-black dark:text-white">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString(
                          'pt-BR'
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white mb-6">
          Escolha seu plano
        </h2>
        {billableTenants.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Precisa de permissão de administrador num workspace para subscrever.
            <Link
              href="/dashboard/workspaces"
              className="ml-1 text-violet-600 dark:text-violet-400 underline"
            >
              Workspaces
            </Link>
          </p>
        ) : (
          <BillingPlanActions
            stripeReady={stripeReady}
            tenants={billableTenants}
            defaultTenantId={defaultTenantId}
            plans={PLANS}
          />
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
          Webhook Stripe
        </h2>
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6 text-sm text-gray-600 dark:text-gray-400">
          <p>
            No{' '}
            <a
              href="https://dashboard.stripe.com/webhooks"
              className="text-violet-600 dark:text-violet-400 underline"
              target="_blank"
              rel="noreferrer"
            >
              Dashboard Stripe
            </a>
            , adicione o endpoint{' '}
            <code className="text-xs bg-black/10 dark:bg-white/10 px-1 rounded break-all">
              POST /api/webhooks/stripe
            </code>{' '}
            com o mesmo{' '}
            <code className="text-xs bg-black/10 dark:bg-white/10 px-1 rounded">
              STRIPE_WEBHOOK_SECRET
            </code>
            . Eventos:{' '}
            <code className="text-xs">checkout.session.completed</code>,{' '}
            <code className="text-xs">customer.subscription.*</code>,{' '}
            <code className="text-xs">invoice.payment_failed</code>.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
          Métodos de pagamento
        </h2>
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-lg border border-gray-200/50 dark:border-white/10 shadow-lg p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-black dark:text-white">
                Stripe Customer Portal
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Use &quot;Gerir faturação e cartão&quot; acima para atualizar o
                cartão ou cancelar a subscrição.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
