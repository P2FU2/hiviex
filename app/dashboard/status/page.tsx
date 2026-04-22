/**
 * Fase 11 — visão operacional: integrações e saúde (sem segredos).
 */

import Link from 'next/link'
import { getAuthSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getServiceFlags } from '@/lib/observability/service-flags'
import { pingRedisDisposable } from '@/lib/observability/redis-disposable-ping'
import { runHealthChecks } from '@/lib/observability/run-health-checks'
import {
  Activity,
  CheckCircle2,
  MinusCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function EnvBadge({ defined }: { defined: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        defined
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
          : 'bg-amber-500/12 text-amber-800 dark:text-amber-300'
      }`}
    >
      {defined ? 'Variável definida' : 'Não definida'}
    </span>
  )
}

type LiveState = 'ok' | 'fail' | 'na'

function LiveBadge({ state, label }: { state: LiveState; label: string }) {
  const icon =
    state === 'ok' ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    ) : state === 'fail' ? (
      <AlertCircle className="h-4 w-4 text-red-500" />
    ) : (
      <MinusCircle className="h-4 w-4 text-[var(--text-tertiary)]" />
    )
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
      {icon}
      <span>{label}</span>
    </div>
  )
}

export default async function SystemStatusPage() {
  await getAuthSession()
  const flags = getServiceFlags()
  const health = await runHealthChecks()

  let dbLiveOk = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbLiveOk = true
  } catch {
    dbLiveOk = false
  }

  const redisLiveOk = flags.redis ? await pingRedisDisposable() : false

  const overallHealthy =
    health.db === 'ok' &&
    health.redis === 'ok' &&
    health.workers !== 'error'

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-[var(--accent)] mb-2">
          <Activity className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Observabilidade
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          Estado do sistema
        </h1>
        <p className="mt-2 text-[var(--text-secondary)] max-w-2xl">
          Mapa das variáveis de ambiente e testes em tempo real.{' '}
          <strong className="font-medium text-[var(--text-primary)]">
            &quot;Não definida&quot;
          </strong>{' '}
          significa apenas que a chave não está neste processo — não implica,
          por si só, que o serviço esteja em falha (algumas integrações são
          opcionais em desenvolvimento).
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 p-5 shadow-[var(--shadow-sm)] backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          Resumo em tempo real
        </h2>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">
          Mesma lógica que{' '}
          <code className="rounded bg-black/5 px-1 dark:bg-white/10">
            GET /api/health
          </code>
          . Útil para balanceadores e monitorização externa.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              overallHealthy
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-500/12 text-amber-900 dark:text-amber-200'
            }`}
          >
            {overallHealthy
              ? 'Serviços principais operacionais'
              : 'Atenção: verifique Redis ou workers'}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            DB: {health.db} · Redis: {health.redis} · Workers:{' '}
            {health.workers}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 p-5 shadow-[var(--shadow-sm)] backdrop-blur-sm overflow-x-auto">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          Configuração detalhada
        </h2>
        <p className="text-xs text-[var(--text-tertiary)] mb-4 max-w-3xl">
          Coluna <strong>Env</strong>: presença da variável. Coluna{' '}
          <strong>Runtime</strong>: teste efectuado neste pedido (quando
          aplicável).
        </p>

        <table className="w-full text-left text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[11px] uppercase tracking-wide text-[var(--text-tertiary)]">
              <th className="py-2 pr-4 font-semibold">Integração</th>
              <th className="py-2 pr-4 font-semibold">Variáveis</th>
              <th className="py-2 pr-4 font-semibold">Env</th>
              <th className="py-2 font-semibold">Runtime</th>
            </tr>
          </thead>
          <tbody className="text-[var(--text-secondary)]">
            <tr className="border-b border-[var(--border-subtle)] align-top">
              <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                PostgreSQL
              </td>
              <td className="py-3 pr-4 font-mono text-xs">DATABASE_URL</td>
              <td className="py-3 pr-4">
                <EnvBadge defined={flags.databaseUrl} />
              </td>
              <td className="py-3">
                <LiveBadge
                  state={dbLiveOk ? 'ok' : 'fail'}
                  label={
                    dbLiveOk
                      ? 'SELECT 1 via Prisma — OK'
                      : 'Falha ao contactar a base de dados'
                  }
                />
              </td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)] align-top">
              <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                Redis / filas
              </td>
              <td className="py-3 pr-4 font-mono text-xs">
                REDIS_URL ou REDIS_HOST (+ porta / palavra-passe)
              </td>
              <td className="py-3 pr-4">
                <EnvBadge defined={flags.redis} />
              </td>
              <td className="py-3">
                {flags.redis ? (
                  <LiveBadge
                    state={redisLiveOk ? 'ok' : 'fail'}
                    label={
                      redisLiveOk
                        ? 'PING — OK (publicação agendada & workers)'
                        : 'PING falhou — filas indisponíveis'
                    }
                  />
                ) : (
                  <LiveBadge
                    state="na"
                    label="Sem Redis configurado — teste omitido"
                  />
                )}
              </td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)] align-top">
              <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                Workers (heartbeat)
              </td>
              <td className="py-3 pr-4 text-xs">
                Depende do Redis e do processo worker
              </td>
              <td className="py-3 pr-4">
                <EnvBadge defined={flags.redis} />
              </td>
              <td className="py-3">
                {!flags.redis ? (
                  <LiveBadge
                    state="na"
                    label="N/A sem Redis"
                  />
                ) : health.workers === 'ok' ? (
                  <LiveBadge
                    state="ok"
                    label="Heartbeat recente em hiviex:health:worker"
                  />
                ) : health.workers === 'degraded' ? (
                  <LiveBadge
                    state="fail"
                    label="Sem heartbeat recente (worker parado ou a arrancar)"
                  />
                ) : (
                  <LiveBadge state="fail" label="Erro ao ler heartbeat" />
                )}
              </td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)] align-top">
              <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                Stripe
              </td>
              <td className="py-3 pr-4 font-mono text-xs">
                STRIPE_SECRET_KEY (+ webhook)
              </td>
              <td className="py-3 pr-4">
                <EnvBadge defined={flags.stripe} />
              </td>
              <td className="py-3">
                <LiveBadge
                  state="na"
                  label="Configure em produção para billing e Customer Portal"
                />
              </td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)] align-top">
              <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                Armazenamento (S3 / R2)
              </td>
              <td className="py-3 pr-4 font-mono text-xs">
                Variáveis do provider (Fase 8 — upload de média)
              </td>
              <td className="py-3 pr-4">
                <EnvBadge defined={flags.objectStorage} />
              </td>
              <td className="py-3">
                <LiveBadge
                  state="na"
                  label="Sem probe automático — validar com um upload de teste"
                />
              </td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)] align-top">
              <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                Sentry
              </td>
              <td className="py-3 pr-4 font-mono text-xs">
                NEXT_PUBLIC_SENTRY_DSN ou SENTRY_DSN
              </td>
              <td className="py-3 pr-4">
                <EnvBadge defined={flags.sentry} />
              </td>
              <td className="py-3">
                <LiveBadge
                  state="na"
                  label="Erros e performance no dashboard Sentry"
                />
              </td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)] align-top">
              <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                NextAuth
              </td>
              <td className="py-3 pr-4 font-mono text-xs">NEXTAUTH_SECRET</td>
              <td className="py-3 pr-4">
                <EnvBadge defined={flags.nextAuth} />
              </td>
              <td className="py-3">
                <LiveBadge
                  state="na"
                  label="Obrigatório em produção para sessões seguras"
                />
              </td>
            </tr>
            <tr className="align-top">
              <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                Cifragem de tokens / OAuth
              </td>
              <td className="py-3 pr-4 font-mono text-xs">
                TOKEN_ENCRYPTION_KEY ou ENCRYPTION_KEY (32 bytes base64)
              </td>
              <td className="py-3 pr-4">
                <EnvBadge defined={flags.tokenEncryption} />
              </td>
              <td className="py-3">
                <LiveBadge
                  state="na"
                  label="Alinhado com lib/utils/encryption — tokens de workspace e API"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-5 flex flex-wrap gap-3 text-xs">
          <Link
            href="/dashboard/integrations"
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 font-medium text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Integrações do workspace
          </Link>
          <Link
            href="/dashboard/apis"
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 font-medium text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            API &amp; chaves
          </Link>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 font-medium text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Faturação (Stripe)
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 p-5 shadow-[var(--shadow-sm)] backdrop-blur-sm text-sm">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Endpoints úteis
        </h2>
        <ul className="space-y-2 text-[var(--text-secondary)]">
          <li>
            <Link
              href="/api/health"
              className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
            >
              GET /api/health
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <span className="block text-xs mt-0.5">
              DB, Redis e heartbeat do worker (JSON).
            </span>
          </li>
          <li>
            <Link
              href="/api/health/db"
              className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
            >
              GET /api/health/db
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <span className="block text-xs mt-0.5">
              Diagnóstico detalhado da base de dados.
            </span>
          </li>
          <li>
            <Link
              href="/status"
              className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
            >
              Página pública de estado
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </li>
        </ul>
      </div>

      <div className="text-xs text-[var(--text-tertiary)]">
        Logs estruturados: importe{' '}
        <code className="rounded bg-black/5 px-1 dark:bg-white/10">
          createLogger
        </code>{' '}
        de{' '}
        <code className="rounded bg-black/5 px-1 dark:bg-white/10">
          @/lib/observability/logger
        </code>
        .
      </div>
    </div>
  )
}
