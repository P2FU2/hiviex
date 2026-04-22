/**
 * Catálogo único de planos (billing + marketing) para evitar preços divergentes.
 */

export const BILLING_PLANS = [
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
] as const

export type BillingPlanId = (typeof BILLING_PLANS)[number]['id']
