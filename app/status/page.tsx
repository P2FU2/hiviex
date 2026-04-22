/**
 * Página pública de estado (estilo status page) — sem autenticação.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { runHealthChecks } from '@/lib/observability/run-health-checks'
import { CheckCircle2, AlertTriangle, MinusCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Estado do serviço',
  description:
    'Estado operacional dos componentes principais da plataforma Hiviex.',
}

function StatusPill({
  ok,
  label,
  detail,
}: {
  ok: boolean
  label: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
      ) : (
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
      )}
      <div>
        <div className="text-sm font-semibold text-[var(--text-primary)]">
          {label}
        </div>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{detail}</p>
      </div>
    </div>
  )
}

function MinorPill({
  state,
  label,
  detail,
}: {
  state: 'ok' | 'degraded' | 'error'
  label: string
  detail: string
}) {
  const Icon =
    state === 'ok'
      ? CheckCircle2
      : state === 'degraded'
        ? MinusCircle
        : AlertTriangle
  const color =
    state === 'ok'
      ? 'text-emerald-500'
      : state === 'degraded'
        ? 'text-amber-500'
        : 'text-red-500'
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 px-4 py-3">
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
      <div>
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </div>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{detail}</p>
      </div>
    </div>
  )
}

export default async function PublicStatusPage() {
  const health = await runHealthChecks()
  const coreOk = health.db === 'ok' && health.redis === 'ok'
  const workersDetail =
    health.workers === 'ok'
      ? 'Processo em segundo plano a reportar heartbeat.'
      : health.workers === 'degraded'
        ? 'Redis OK, mas sem heartbeat recente do worker (pode estar a arrancar).'
        : health.redis !== 'ok'
          ? 'Depende do Redis; não avaliado.'
          : 'Não foi possível confirmar o heartbeat.'

  return (
    <div className="landing-cursor-custom min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight hover:opacity-80"
          >
            Hiviex
          </Link>
          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            <Link href="/signin" className="hover:text-[var(--accent)]">
              Entrar
            </Link>
            <Link href="/" className="hover:text-[var(--accent)]">
              Site
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          Estado do serviço
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {coreOk
            ? 'Componentes principais operacionais'
            : 'Degradação ou indisponibilidade'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          Resumo automático com base em{' '}
          <code className="rounded bg-black/5 px-1 text-xs dark:bg-white/10">
            /api/health
          </code>
          . Para configuração fina e variáveis de ambiente, a equipa usa o
          painel interno em{' '}
          <Link href="/dashboard/status" className="text-[var(--accent)] hover:underline">
            Estado do sistema
          </Link>
          .
        </p>

        <div className="mt-10 space-y-3">
          <StatusPill
            ok={health.db === 'ok'}
            label="PostgreSQL"
            detail={
              health.db === 'ok'
                ? 'Consulta de verificação (SELECT 1) concluída com sucesso.'
                : 'A base de dados não respondeu como esperado.'
            }
          />
          <StatusPill
            ok={health.redis === 'ok'}
            label="Redis"
            detail={
              health.redis === 'ok'
                ? 'Broker de filas e cache respondem a PING.'
                : 'Redis indisponível — filas e publicação agendada podem falhar.'
            }
          />
          <MinorPill
            state={
              health.workers === 'ok'
                ? 'ok'
                : health.workers === 'degraded'
                  ? 'degraded'
                  : 'error'
            }
            label="Workers em segundo plano"
            detail={workersDetail}
          />
        </div>

        <section className="mt-14 border-t border-[var(--border-subtle)] pt-10">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Histórico
          </h2>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Incidentes formais e changelog de produto são comunicados na página{' '}
            <Link href="/changelog" className="text-[var(--accent)] hover:underline">
              Changelog
            </Link>
            . Esta página reflecte apenas o estado técnico actual.
          </p>
        </section>

        <p className="mt-10 text-[11px] text-[var(--text-tertiary)]">
          Última verificação: pedido gerado em{' '}
          {new Date().toLocaleString('pt-PT', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
          .
        </p>
      </main>
    </div>
  )
}
