import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Novidades e melhorias da plataforma Hiviex.',
}

const ENTRIES = [
  {
    date: '2026-04',
    title: 'Painel de estado e página pública /status',
    body: 'Mapa de variáveis de ambiente com distinção entre presença no env e testes em runtime; página de estado inspirada em status pages empresariais.',
  },
  {
    date: '2026-04',
    title: 'Flow Builder e filas',
    body: 'Workflows visuais, Redis/BullMQ para tarefas em segundo plano e integração com publicação agendada.',
  },
  {
    date: '2026-03',
    title: 'Billing com Stripe',
    body: 'Planos Free, Starter, Professional e Enterprise com Checkout e Customer Portal quando o Stripe está configurado.',
  },
]

export default function ChangelogPage() {
  return (
    <div className="landing-cursor-custom min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold hover:opacity-80">
            Hiviex
          </Link>
          <Link
            href="/status"
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]"
          >
            Estado
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Changelog
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Resumo das entregas recentes. Para detalhes técnicos, consulte o
          repositório ou notas de release da sua organização.
        </p>

        <ol className="mt-12 space-y-10 border-l border-[var(--border-subtle)] pl-6">
          {ENTRIES.map((e) => (
            <li key={e.title} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-[var(--accent)]" />
              <time className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                {e.date}
              </time>
              <h2 className="mt-1 text-base font-semibold">{e.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {e.body}
              </p>
            </li>
          ))}
        </ol>
      </main>
    </div>
  )
}
