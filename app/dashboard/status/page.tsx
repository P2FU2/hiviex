/**
 * Fase 11 — visão operacional: integrações e saúde (sem segredos).
 */

import Link from 'next/link'
import { getAuthSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getServiceFlags } from '@/lib/observability/service-flags'
import { Activity, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

function FlagRow({
  label,
  ok,
  hint,
}: {
  label: string
  ok: boolean
  hint?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-200/60 dark:border-white/10 last:border-0">
      <div>
        <p className="text-sm font-medium text-black dark:text-white">{label}</p>
        {hint ? (
          <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
        ) : null}
      </div>
      {ok ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-amber-500 shrink-0" />
      )}
    </div>
  )
}

export default async function SystemStatusPage() {
  await getAuthSession()
  const flags = getServiceFlags()

  let dbOk = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    dbOk = false
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-2">
          <Activity className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Observabilidade
          </span>
        </div>
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Estado do sistema
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Variáveis de ambiente e ligações críticas. Erros em produção devem ir
          para o Sentry quando o DSN estiver definido.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-zinc-950/70 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-black dark:text-white mb-1">
          Configuração
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          &quot;Não configurado&quot; não implica que o serviço falhe — apenas
          que a variável não está presente neste runtime.
        </p>
        <FlagRow
          label="Base de dados (DATABASE_URL)"
          ok={flags.databaseUrl}
          hint="Ligação efetiva testada abaixo."
        />
        <FlagRow
          label="PostgreSQL — query SELECT 1"
          ok={dbOk}
          hint={dbOk ? 'Prisma conseguiu executar uma query.' : 'Falha ao contactar o Postgres.'}
        />
        <FlagRow
          label="Redis / filas (REDIS_URL ou REDIS_HOST)"
          ok={flags.redis}
          hint="Necessário para publicação agendada e workers de flow em produção."
        />
        <FlagRow
          label="Stripe (STRIPE_SECRET_KEY)"
          ok={flags.stripe}
          hint="Billing e Customer Portal."
        />
        <FlagRow
          label="Armazenamento S3/R2"
          ok={flags.objectStorage}
          hint="Upload de mídia (Fase 8)."
        />
        <FlagRow
          label="Sentry (NEXT_PUBLIC_SENTRY_DSN ou SENTRY_DSN)"
          ok={flags.sentry}
          hint="Erros e performance no dashboard Sentry."
        />
        <FlagRow
          label="NextAuth (NEXTAUTH_SECRET)"
          ok={flags.nextAuth}
        />
        <FlagRow
          label="Cifragem de tokens (TOKEN_ENCRYPTION_KEY)"
          ok={flags.tokenEncryption}
          hint="OAuth e API keys do workspace."
        />
      </div>

      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-zinc-950/70 p-5 shadow-sm text-sm">
        <h2 className="text-sm font-semibold text-black dark:text-white mb-3">
          Endpoints úteis
        </h2>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li>
            <Link
              href="/api/health/db"
              className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:underline"
            >
              GET /api/health/db
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <span className="block text-xs mt-0.5">
              Diagnóstico detalhado da base de dados.
            </span>
          </li>
        </ul>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Logs estruturados no código: importe{' '}
        <code className="bg-black/5 dark:bg-white/10 px-1 rounded">
          createLogger
        </code>{' '}
        de{' '}
        <code className="bg-black/5 dark:bg-white/10 px-1 rounded">
          @/lib/observability/logger
        </code>
        .
      </div>
    </div>
  )
}
