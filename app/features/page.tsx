import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clapperboard, GitBranch, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Funcionalidades',
  description:
    'Agentes de IA, vídeo, fluxos visuais e integrações — Hiviex num relance.',
}

const BLOCKS = [
  {
    icon: Sparkles,
    title: 'Agentes e identidade',
    desc: 'Modelos configuráveis, contexto por workspace e fluxos de aprovação antes de publicar.',
  },
  {
    icon: Clapperboard,
    title: 'Pipeline de vídeo',
    desc: 'Ingestão, processamento assíncrono e entrega com URLs estáveis para revisão e redes.',
  },
  {
    icon: GitBranch,
    title: 'Flow Builder',
    desc: 'Canvas tipo Linear: nós claros, atalhos de teclado e disparos manuais ou webhook.',
  },
]

export default function FeaturesPage() {
  return (
    <div className="landing-cursor-custom min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold hover:opacity-80">
            Hiviex
          </Link>
          <nav className="flex items-center gap-6 text-xs text-[var(--text-secondary)]">
            <Link href="/changelog" className="hover:text-[var(--accent)]">
              Changelog
            </Link>
            <Link href="/status" className="hover:text-[var(--accent)]">
              Estado
            </Link>
            <Link
              href="/signin"
              className="font-medium text-[var(--accent)] hover:underline"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tudo o que precisa para operar conteúdo em escala
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Uma única superfície para equipas que tratam de IA, vídeo, calendário
          editorial e integrações — com a mesma clareza visual que espera de
          ferramentas como Linear.
        </p>
        <Link
          href="/#precos"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--accent-hover)] dark:text-[var(--accent-foreground)]"
        >
          Ver planos
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {BLOCKS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 p-6 shadow-[var(--shadow-xs)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                <b.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h2 className="mt-4 text-base font-semibold">{b.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
