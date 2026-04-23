/**
 * Resumo de variáveis críticas (sem expor segredos) + ligação ao painel detalhado.
 */

import Link from 'next/link'
import { getServiceFlags } from '@/lib/observability/service-flags'
import { Card } from '@/components/ui/Card'
import { CheckCircle2, AlertCircle, ArrowRight, Info } from 'lucide-react'
import { dashLink } from '@/lib/dashboard-ui'

export default async function FeatureReadinessCard() {
  const f = getServiceFlags()
  const rows = [
    {
      ok: f.databaseUrl,
      label: 'PostgreSQL',
      hint: 'DATABASE_URL — dados da aplicação',
      optional: false,
      fix: 'Defina DATABASE_URL (ex.: Render Postgres) no .env do servidor.',
    },
    {
      ok: f.redis,
      label: 'Redis / filas',
      hint: 'Publicação agendada, workers (flows, vídeo, influencer)',
      optional: false,
      fix: 'REDIS_URL ou REDIS_HOST (e porta) — necessário para BullMQ e publicação agendada.',
    },
    {
      ok: f.tokenEncryption,
      label: 'Cifragem de tokens',
      hint: 'TOKEN_ENCRYPTION_KEY ou ENCRYPTION_KEY — OAuth e chaves API',
      optional: false,
      fix: 'Gere bytes aleatórios (32+) e defina TOKEN_ENCRYPTION_KEY. Ver .env.example.',
    },
    {
      ok: f.nextAuth,
      label: 'NextAuth',
      hint: 'NEXTAUTH_SECRET — sessões em produção',
      optional: false,
      fix: 'openssl rand -base64 32 (ou similar) e copie para NEXTAUTH_SECRET.',
    },
    {
      ok: f.objectStorage,
      label: 'Armazenamento de objetos',
      hint: 'S3/R2 — uploads em Mídia e pipeline de vídeo',
      optional: false,
      fix: 'S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY; R2: S3_ENDPOINT e S3_PUBLIC_BASE_URL.',
    },
    {
      ok: f.stripe,
      label: 'Stripe',
      hint: 'Planos, Checkout e Customer Portal',
      optional: false,
      fix: 'STRIPE_SECRET_KEY (e chaves pública) — necessário para billing e portal do cliente.',
    },
    {
      ok: f.sentry,
      label: 'Sentry',
      hint: 'Opcional — erros e performance',
      optional: true,
      fix: 'NEXT_PUBLIC_SENTRY_DSN ou SENTRY_DSN no deploy.',
    },
  ]
  const missing = rows.filter((r) => !r.ok).length
  const criticalMissing = !f.databaseUrl || !f.nextAuth || !f.tokenEncryption
  const criticalLabels = [
    { ok: f.databaseUrl, name: 'base de dados' },
    { ok: f.nextAuth, name: 'NextAuth' },
    { ok: f.tokenEncryption, name: 'cifragem' },
  ]
    .filter((x) => !x.ok)
    .map((x) => x.name)
  const criticalMsg =
    criticalLabels.length > 0
      ? `Crítico: ${criticalLabels.join(', ')} em falta — corrija antes de produção.`
      : ''

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
          <strong className="font-semibold">Atenção.</strong> {criticalMsg}
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

      <ul className="mt-6 grid auto-rows-fr gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex min-h-[4.5rem] gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-base)]/50 px-3 py-2.5"
          >
            {r.ok ? (
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                strokeWidth={1.75}
              />
            ) : r.optional ? (
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
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
                {r.optional ? (
                  <span className="ml-1.5 text-[10px] font-normal text-[var(--text-tertiary)]">
                    (opcional)
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                {r.hint}
              </p>
              {!r.ok ? (
                <p className="mt-1.5 text-xs leading-snug text-[var(--text-secondary)]">
                  {r.fix}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
