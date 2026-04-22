'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clapperboard,
  Code2,
  CreditCard,
  GitBranch,
  Instagram,
  Sparkles,
  Webhook,
  Youtube,
  Zap,
} from 'lucide-react'
import LandingNav from '@/components/landing/LandingNav'
import BlurBackground from '@/components/BlurBackground'
import { BILLING_PLANS } from '@/lib/billing/plans-catalog'

function formatPlanPrice(eur: number) {
  if (eur === 0) return '0€'
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(eur)
}

const fade = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
}

export default function LandingHome() {
  return (
    <div className="landing-cursor-custom relative min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)]">
      <LandingNav />
      <BlurBackground />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40 dark:opacity-30"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, var(--accent-muted), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(99,102,241,0.08), transparent)',
        }}
      />

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-24 pt-28 sm:px-6 sm:pt-32 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <p className="mb-4 text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
              Estúdio social com IA
            </p>
            <h1 className="text-display text-balance text-[var(--text-primary)]">
              Conteúdo que escala. Sem perder a sua voz.
            </h1>
            <p className="mt-6 max-w-xl text-body-lg text-[var(--text-secondary)] text-pretty">
              Influenciadores de IA, vídeo automatizado, fluxos e publicação — numa única experiência
              minimalista, feita para equipas que exigem velocidade e consistência.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('precos')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-premium-sm transition-all duration-base hover:bg-[var(--accent-hover)] dark:text-[var(--accent-foreground)]"
              >
                Ver planos
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-elevated)]/60 px-5 py-3 text-sm font-medium text-[var(--text-primary)] backdrop-blur-sm transition-colors duration-base hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Entrar na app
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/60 p-8 shadow-premium-md backdrop-blur-md sm:p-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-muted)] via-transparent to-transparent opacity-60" />
            <div className="relative grid gap-6 sm:grid-cols-3">
              {[
                { n: '24/7', l: 'automação contínua' },
                { n: '1', l: 'painel unificado' },
                { n: '∞', l: 'variações de marca' },
              ].map((s) => (
                <div key={s.l} className="text-center sm:text-left">
                  <div className="text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{s.n}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Pilares */}
        <section id="produto" className="border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)]/40 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div {...fade} className="mb-14 max-w-xl">
              <h2 className="text-title text-[var(--text-primary)]">Três pilares. Um fluxo.</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                Menos ferramentas dispersas. Mais clareza do que acontece em cada etapa.
              </p>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  title: 'Influenciadores de IA',
                  desc: 'Versões, referências e aprovação — identidade consistente antes de publicar.',
                },
                {
                  icon: Clapperboard,
                  title: 'Fábrica de vídeo',
                  desc: 'Ingestão, cortes, legendas e export final com filas e URLs públicas.',
                },
                {
                  icon: GitBranch,
                  title: 'Fluxos e integrações',
                  desc: 'Workflows, calendário editorial e redes com OAuth e workers em segundo plano.',
                },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  {...fade}
                  transition={{ ...fade.transition, delay: i * 0.06 }}
                  className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-6 transition-all duration-base hover:border-[var(--border-strong)] hover:shadow-premium-sm"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                    <c.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{c.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrações — fluxo claro para configurar depois do login */}
        <section
          id="integracoes"
          className="border-t border-[var(--border-subtle)] py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div {...fade} className="mb-12 max-w-xl">
              <h2 className="text-title text-[var(--text-primary)]">
                Integrações que fazem sentido no mesmo sítio
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                Ligue contas, webhooks e API no dashboard — sem saltar entre
                consolas. O estado de cada serviço está em{' '}
                <Link
                  href="/status"
                  className="font-medium text-[var(--accent)] hover:underline"
                >
                  /status
                </Link>{' '}
                e o mapa de variáveis na área autenticada.
              </p>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Instagram,
                  title: 'Redes sociais',
                  desc: 'OAuth por workspace, calendário e publicação com filas em produção.',
                  href: '/signin',
                },
                {
                  icon: Youtube,
                  title: 'Vídeo & ingestão',
                  desc: 'Pipeline de média com armazenamento S3/R2 quando configurado.',
                  href: '/signin',
                },
                {
                  icon: Webhook,
                  title: 'Webhooks de fluxo',
                  desc: 'Dispare flows a partir de n8n, Zapier ou o seu backend.',
                  href: '/features',
                },
                {
                  icon: Code2,
                  title: 'API & chaves',
                  desc: 'Endpoints documentados no painel; ideal para automações internas.',
                  href: '/signin',
                },
                {
                  icon: CreditCard,
                  title: 'Stripe',
                  desc: 'Planos e Customer Portal quando STRIPE_SECRET_KEY está definido.',
                  href: '/signin',
                },
                {
                  icon: GitBranch,
                  title: 'Flow Builder',
                  desc: 'Canvas com atalhos, estados e revisão antes de activar.',
                  href: '/features',
                },
              ].map((item, i) => (
                <motion.div key={item.title} {...fade} transition={{ ...fade.transition, delay: i * 0.05 }}>
                  <Link
                    href={item.href}
                    className="group flex h-full flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/50 p-5 transition-all duration-base hover:border-[var(--border-strong)] hover:shadow-premium-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                        <item.icon className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {item.desc}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Resultados / features */}
        <section id="resultados" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div {...fade} className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-title text-[var(--text-primary)]">Feito para outcomes</h2>
                <p className="mt-2 max-w-lg text-sm text-[var(--text-secondary)]">
                  Frases curtas, hierarquia clara — como as equipas melhores gostam de trabalhar.
                </p>
              </div>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'Publicar no tempo certo, sem copy-paste entre plataformas.',
                'Legendas e master final com rastreio por projeto.',
                'Roles e workspaces isolados por cliente ou marca.',
                'Dark mode nativo, tipografia legível, densidade controlada.',
              ].map((text, i) => (
                <motion.div
                  key={text}
                  {...fade}
                  transition={{ ...fade.transition, delay: i * 0.05 }}
                  className="flex gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/50 p-5"
                >
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Prova social mínima */}
        <section className="border-y border-[var(--border-subtle)] py-12">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
              Concebido para criadores e operações de conteúdo
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
              Da ideia ao post agendado, com menos ruído visual e mais confiança em cada clique.
            </p>
          </div>
        </section>

        {/* Preços — cartões discretos */}
        <section id="precos" className="border-t border-[var(--border-subtle)] py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div {...fade} className="mb-10 max-w-xl">
              <h2 className="text-title text-[var(--text-primary)]">Planos claros</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Os valores abaixo espelham o catálogo interno. Após entrar, subscreva
                ou faça upgrade em{' '}
                <span className="font-medium text-[var(--text-primary)]">
                  Faturação
                </span>{' '}
                (Stripe em produção).
              </p>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {BILLING_PLANS.map((p, i) => {
                const highlight = p.id === 'PROFESSIONAL'
                const isEnterprise = p.id === 'ENTERPRISE'
                return (
                  <motion.div
                    key={p.id}
                    {...fade}
                    transition={{ ...fade.transition, delay: i * 0.05 }}
                    className={`flex flex-col rounded-2xl border p-6 transition-all duration-base ${
                      highlight
                        ? 'border-[var(--accent)] bg-[var(--accent-muted)]/40 shadow-premium-sm sm:scale-[1.02]'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-elevated)]/50 hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                      {p.name}
                    </div>
                    <div className="mt-3 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                      {isEnterprise ? 'Desde ' : ''}
                      {formatPlanPrice(p.price)}
                      {!isEnterprise && p.price > 0 ? (
                        <span className="text-sm font-normal text-[var(--text-tertiary)]">
                          /mês
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {p.id === 'FREE'
                        ? 'Para experimentar fluxos e integrações.'
                        : p.id === 'STARTER'
                          ? 'Equipas em arranque com publicação regular.'
                          : p.id === 'PROFESSIONAL'
                            ? 'Operações que publicam todos os dias.'
                            : 'Volume, SLA e requisitos de compliance.'}
                    </p>
                    <ul className="mt-6 flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signin"
                      className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                        highlight
                          ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] dark:text-[var(--accent-foreground)]'
                          : 'border border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                      }`}
                    >
                      {p.id === 'FREE' ? 'Começar grátis' : 'Subscrever'}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                )
              })}
            </div>
            <p className="mt-6 text-xs text-[var(--text-tertiary)]">
              O operador da instância deve configurar Stripe e webhooks; até lá, os
              planos mostram preços de referência e a faturação pode estar
              indisponível.
            </p>
          </div>
        </section>

        <section id="comece" className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              {...fade}
              className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--accent-muted)] to-transparent p-10 sm:p-14"
            >
              <div className="relative max-w-xl">
                <h2 className="text-title text-[var(--text-primary)]">Pronto para subir de patamar?</h2>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Explore o dashboard, ligue integrações e use o calendário editorial.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/signin"
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--text-primary)] px-5 py-3 text-sm font-medium text-[var(--surface-elevated)] transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-900"
                  >
                    Aceder à app
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#produto"
                    className="inline-flex items-center rounded-xl border border-[var(--border-strong)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
                  >
                    Rever produto
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--border-subtle)] py-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="text-sm font-semibold">Hiviex</div>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Estúdio social e IA</p>
            </div>
            <div className="flex flex-wrap gap-6 text-xs text-[var(--text-secondary)]">
              <Link href="/features" className="transition-colors hover:text-[var(--text-primary)]">
                Funcionalidades
              </Link>
              <Link href="/changelog" className="transition-colors hover:text-[var(--text-primary)]">
                Changelog
              </Link>
              <Link href="/status" className="transition-colors hover:text-[var(--text-primary)]">
                Estado
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-[var(--text-primary)]">
                Privacidade
              </Link>
              <Link href="/terms" className="transition-colors hover:text-[var(--text-primary)]">
                Termos
              </Link>
              <Link href="/cookies" className="transition-colors hover:text-[var(--text-primary)]">
                Cookies
              </Link>
              <Link href="/dashboard" className="transition-colors hover:text-[var(--accent)]">
                App
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
