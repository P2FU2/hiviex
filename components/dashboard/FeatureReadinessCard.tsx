/**
 * Resumo de variáveis críticas (sem expor segredos) + ligação ao painel detalhado.
 */

import Link from 'next/link'
import { getServiceFlags } from '@/lib/observability/service-flags'
import { Card } from '@/components/ui/Card'
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { dashLink } from '@/lib/dashboard-ui'

export default async function FeatureReadinessCard() {
  const f = getServiceFlags()
  const rows = [
    {
      ok: f.databaseUrl,
      label: 'PostgreSQL',
      hint: 'DATABASE_URL — dados da aplicação',
    },
    {
      ok: f.redis,
      label: 'Redis / filas',
      hint: 'Publicação agendada, workers (flows, vídeo, influencer)',
    },
    {
      ok: f.tokenEncryption,
      label: 'Cifragem de tokens',
      hint: 'TOKEN_ENCRYPTION_KEY ou ENCRYPTION_KEY — OAuth e chaves API',
    },
    {
      ok: f.nextAuth,
      label: 'NextAuth',
      hint: 'NEXTAUTH_SECRET — sessões em produção',
    },
    {
      ok: f.objectStorage,
      label: 'Armazenamento de objetos',
      hint: 'S3/R2 — uploads em Mídia e pipeline de vídeo',
    },
    {
      ok: f.stripe,
      label: 'Stripe',
      hint: 'Planos, Checkout e Customer Portal',
    },
    {
      ok: f.sentry,
      label: 'Sentry',
      hint: 'Opcional — erros e performance',
    },
  ]
  const missing = rows.filter((r) => !r.ok).length
  const criticalMissing = !f.databaseUrl || !f.nextAuth || !f.tokenEncryption

  return (
    <Card padding="lg" className="border-[var(--border-subtle)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-title text-[var(--text-primary)]">
            Prontidão do ambiente
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
            Cada funcionalidade depende de serviços configurados. Itens em
            alerta não impedem sempre a app local, mas limitam produção (ex. sem
            Redis não há filas nem publicação agendada fiável).
          </p>
        </div>
        <Link
          href="/dashboard/status"
          className={`${dashLink} inline-flex shrink-0 items-center gap-1 self-start`}
        >
          Ver diagnóstico completo
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>

      {criticalMissing ? (
        <p className="mt-4 rounded-lg border border-[var(--danger-muted)] bg-[var(--danger-muted)]/30 px-3 py-2 text-xs text-[var(--text-primary)]">
          <strong className="font-semibold">Crítico:</strong> base de dados,
          NextAuth ou cifragem em falta — corrija antes de produção.
        </p>
      ) : missing > 0 ? (
        <p className="mt-4 rounded-lg border border-[var(--warning-muted)] bg-[var(--warning-muted)]/25 px-3 py-2 text-xs text-[var(--text-secondary)]">
          {missing} integração(ões) opcional(is) ou de segundo plano por
          configurar — veja o detalhe abaixo ou em Estado do sistema.
        </p>
      ) : (
        <p className="mt-4 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Todas as verificações listadas estão definidas neste runtime.
        </p>
      )}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)]/50 px-3 py-2.5"
          >
            {r.ok ? (
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                strokeWidth={1.75}
              />
            ) : (
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                strokeWidth={1.75}
              />
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {r.label}
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                {r.hint}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
