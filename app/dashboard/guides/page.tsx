/**
 * Guias e trilhas de aprendizagem — do zero ao uso avançado.
 */

'use client'

import Link from 'next/link'
import {
  Book,
  Bot,
  GitBranch,
  BarChart3,
  Settings,
  Key,
  Activity,
  GraduationCap,
  Footprints,
  Crown,
  ChevronRight,
  LayoutDashboard,
  Users,
  Code2,
  Images,
  CalendarDays,
  Plug,
  Clapperboard,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { dashLink } from '@/lib/dashboard-ui'

const learningTrails = [
  {
    id: 'inicio',
    title: '1 · Primeiros passos',
    badge: 'Iniciante',
    time: 'ca. 20 min',
    description:
      'Contexto, chaves e primeiro agente — o mínimo para conversar com um modelo no Hiviex.',
    icon: GraduationCap,
    tone: 'violet' as const,
    steps: [
      { text: 'Abre o', link: { href: '/dashboard', label: 'Dashboard' }, rest: 'e escolhe um workspace (ou cria em Workspaces).' },
      { text: 'Em', link: { href: '/dashboard/settings', label: 'Definições' }, rest: '→ API keys, adiciona pelo menos OpenAI, Anthropic ou outro fornecedor suportado.' },
      { text: 'Confere', link: { href: '/dashboard/apis', label: 'APIs e IA' }, rest: 'para ver o resumo de modelos e ligação ao chat/flows.' },
      { text: 'Em', link: { href: '/dashboard/agents/new', label: 'Criar Agente' }, rest: 'define nome, persona e guarda.' },
      { text: 'Testa no', link: { href: '/dashboard/chat', label: 'Chat' }, rest: 'e itera o prompt se precisar.' },
    ],
  },
  {
    id: 'automacao',
    title: '2 · Fluxos e automação',
    badge: 'Intermédio',
    time: 'ca. 30 min',
    description:
      'Ligar blocos (contexto, processo, agente) e executar de ponta a ponta.',
    icon: Footprints,
    tone: 'teal' as const,
    steps: [
      { text: 'Lista flows em', link: { href: '/dashboard/flows', label: 'Flow Builder' }, rest: 'e abre Criar Flow para um canvas novo.' },
      { text: 'Usa a barra lateral (Adicionar) para inserir nós, liga as saídas/entradas e grava o flow.' },
      { text: 'Acompanha resultados e histórico em', link: { href: '/dashboard/flows/executions', label: 'Execuções' }, rest: '.' },
      { text: 'Opcional: workflows clássicos em', link: { href: '/dashboard/workflows', label: 'Meus Workflows' }, rest: 'se usares o outro caminho de automação.' },
    ],
  },
  {
    id: 'conteudo',
    title: '3 · Conteúdo e canais',
    badge: 'Intermédio',
    time: 'ca. 40 min',
    description:
      'Ficheiros, calendário e redes — publicar com consistência (requer integrações e mídia configuradas).',
    icon: CalendarDays,
    tone: 'amber' as const,
    steps: [
      { text: 'Carrega media em', link: { href: '/dashboard/media', label: 'Mídia' }, rest: ' (S3/R2 no servidor, ver Prontidão do ambiente se falhar).' },
      { text: 'Planeia em', link: { href: '/dashboard/calendar', label: 'Calendário' }, rest: ' e liga contas em', rightLink: { href: '/dashboard/integrations', label: 'Integrações' }, rest2: '.' },
      { text: 'Nos', link: { href: '/dashboard/influencers', label: 'Influenciadores AI' }, rest: ' geres versões e identidade; em' },
      { text: '', link: { href: '/dashboard/video', label: 'Vídeo' }, rest: ' encontras transcrição, análise de clips e export final.' },
    ],
  },
  {
    id: 'pro',
    title: '4 · Escala e operação',
    badge: 'Pro',
    time: 'contínuo',
    description:
      'Métricas, faturação, saúde do ambiente e otimização em produção.',
    icon: Crown,
    tone: 'zinc' as const,
    steps: [
      { text: 'Métricas e relatórios em', link: { href: '/dashboard/analytics', label: 'Analytics' }, rest: '.' },
      { text: 'Planos e portal em', link: { href: '/dashboard/billing', label: 'Billing' }, rest: ' (Stripe no deploy).' },
      { text: 'Sem workers ou Redis, filas não avançam — confirma em', link: { href: '/dashboard/status', label: 'Sistema' }, rest: ' e no cartão "Prontidão" do dashboard.' },
    ],
  },
] as const

const toneRing: Record<(typeof learningTrails)[number]['tone'], string> = {
  violet: 'border-violet-500/30 bg-violet-500/[0.06]',
  teal: 'border-teal-500/30 bg-teal-500/[0.06]',
  amber: 'border-amber-500/30 bg-amber-500/[0.06]',
  zinc: 'border-zinc-500/30 bg-zinc-500/[0.06]',
}

const quickLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Resumo e prontidão' },
  { href: '/dashboard/workspaces', label: 'Workspaces', icon: Users, desc: 'Contexto / equipa' },
  { href: '/dashboard/apis', label: 'APIs e IA', icon: Code2, desc: 'Modelos e chaves' },
  { href: '/dashboard/flows', label: 'Flow Builder', icon: GitBranch, desc: 'Automatizar com nós' },
  { href: '/dashboard/agents', label: 'Agentes', icon: Bot, desc: 'Personas e chat' },
  { href: '/dashboard/media', label: 'Mídia', icon: Images, desc: 'Ficheiros' },
  { href: '/dashboard/status', label: 'Sistema', icon: Activity, desc: 'Estado e variáveis' },
  { href: '/dashboard/settings', label: 'Definições', icon: Settings, desc: 'Perfil e API keys' },
]

const topicGuides = [
  {
    id: 'flow-builder',
    title: 'Flow Builder',
    icon: GitBranch,
    color: 'blue' as const,
    sections: [
      {
        title: 'Criar um flow',
        steps: [
          'Vai a Workflows → Flow Builder (ou Criar Flow).',
          'Usa "Adicionar" para inserir Forma, Contexto, Processo, Agente, etc.',
          'Clica no nó para editar; arrasta a partir das alças para ligar nós.',
          'Guarda o flow antes de sair (comportamento depende do teu rascunho).',
        ],
      },
      {
        title: 'Executar e rever',
        steps: [
          'Garante que o agente aponta para um modelo e chaves válidas (Definições / APIs e IA).',
          'Inicia a execução a partir do flow (ou do painel) e segue o estado.',
          'Histórico em Workflows → Execuções.',
        ],
      },
    ],
  },
  {
    id: 'agents',
    title: 'Agentes',
    icon: Bot,
    color: 'purple' as const,
    sections: [
      {
        title: 'Criar e iterar',
        steps: [
          'Agents → Criar Agente com nome, descrição e system prompt.',
          'Ajusta persona em Agentes → [agente] → Persona, se existir o passo no teu plano.',
          'Chat para testar; rever biblioteca de templates em Biblioteca, se fizer sentido.',
        ],
      },
    ],
  },
  {
    id: 'api-keys',
    title: 'Chaves de API (LLM)',
    icon: Key,
    color: 'green' as const,
    sections: [
      {
        title: 'No Hiviex',
        steps: [
          'Definições → secção API keys.',
          'Escolhe o fornecedor (OpenAI, Anthropic, Cohere, custom).',
          'Cole a chave e guarda; o runtime usa o workspace/tenant ativo.',
        ],
      },
      {
        title: 'Onde obter (exemplos)',
        steps: [
          'OpenAI: platform.openai.com → API keys.',
          'Anthropic: console.anthropic.com → API Keys.',
          'Cohere: dashboard.cohere.com — API keys.',
        ],
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    color: 'orange' as const,
    sections: [
      {
        title: 'Navegação',
        steps: [
          'Analytics → Dashboard, Relatórios e Métricas (submenu lateral).',
          'Filtra por período e exporta se a UI permitir no teu plano.',
        ],
      },
    ],
  },
  {
    id: 'environment',
    title: 'Ambiente e operação em produção',
    icon: Activity,
    color: 'slate' as const,
    sections: [
      {
        title: 'O que verificar',
        steps: [
          'Dashboard: cartão "Prontidão do ambiente" (ou liga a Sistema / Estado do sistema).',
          'PostgreSQL, Redis, chaves de cifragem e NextAuth são críticos em produção.',
          'Mídia (S3/R2) e Stripe conforme a tua fase (uploads, billing).',
        ],
      },
      {
        title: 'Workers',
        steps: [
          'Executa o processo worker (ex. npm run worker) no mesmo ambiente com Redis.',
          'GET /api/health — heartbeat de worker em hiviex:health:worker, quando ativo.',
        ],
      },
    ],
  },
]

const colorClasses = {
  blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
  green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  slate: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/40',
}

type StepLine = (typeof learningTrails)[number]['steps'][number]

function TrailStepText({ line }: { line: StepLine }) {
  if ('rightLink' in line && line.rightLink) {
    return (
      <span className="text-[var(--text-secondary)]">
        {line.text}
        {line.link ? (
          <>
            {' '}
            <Link className={dashLink} href={line.link.href}>
              {line.link.label}
            </Link>
            {' '}
          </>
        ) : null}
        {line.rest}{' '}
        <Link className={dashLink} href={line.rightLink.href}>
          {line.rightLink.label}
        </Link>
        {line.rest2}
      </span>
    )
  }
  if (!('link' in line) || !line.link) {
    return <span className="text-[var(--text-secondary)]">{line.text}</span>
  }
  return (
    <span className="text-[var(--text-secondary)]">
      {line.text}{' '}
      <Link className={dashLink} href={line.link.href}>
        {line.link.label}
      </Link>
      {line.rest}
    </span>
  )
}

export default function GuidesPage() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <Book className="h-8 w-8 text-[var(--text-primary)]" />
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Guias</h1>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Trilhas simples (zero → pro) e tópicos de referência. A ordem do menu lateral
          segue a mesma lógica: configuração de IA, criação, conteúdo, canais e escala.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Trilhas de aprendizagem
        </h2>
        <div className="grid gap-4">
          {learningTrails.map((trail) => {
            const Icon = trail.icon
            return (
              <Card
                key={trail.id}
                padding="lg"
                className={`${toneRing[trail.tone]} border-2 transition-colors`}
              >
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[var(--surface-base)] p-2.5 text-[var(--accent)]">
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                          {trail.title}
                        </h3>
                        <span className="rounded-md bg-[var(--surface-base)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                          {trail.badge}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)]">{trail.time}</span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {trail.description}
                      </p>
                    </div>
                  </div>
                </div>
                <ol className="space-y-3">
                  {trail.steps.map((line, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm"
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-base)] text-xs font-semibold text-[var(--text-primary)]"
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <TrailStepText line={line} />
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Acesso rápido
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quickLinks.map((q) => {
            const QIcon = q.icon
            return (
              <Link
                key={q.href}
                href={q.href}
                className="group flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 px-4 py-3 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-base)]"
              >
                <QIcon
                  className="h-5 w-5 shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--accent)]"
                  strokeWidth={1.75}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--text-primary)]">{q.label}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{q.desc}</div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Tópicos (referência)
        </h2>
        <div className="space-y-6">
          {topicGuides.map((guide) => {
            const Icon = guide.icon
            return (
              <Card key={guide.id} padding="lg" className="border-[var(--border-subtle)]">
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className={`rounded-lg p-3 ${colorClasses[guide.color]}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                    {guide.title}
                  </h2>
                </div>

                <div className="space-y-6">
                  {guide.sections.map((section, idx) => (
                    <div
                      key={idx}
                      className="border-l-2 border-[var(--border-subtle)] pl-4"
                    >
                      <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">
                        {section.title}
                      </h3>
                      <ol className="space-y-2">
                        {section.steps.map((step, stepIdx) => (
                          <li
                            key={stepIdx}
                            className="flex gap-3 text-sm text-[var(--text-secondary)]"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-base)] text-xs font-medium text-[var(--text-primary)]">
                              {stepIdx + 1}
                            </span>
                            <span className="min-w-0 flex-1 leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      <p className="text-center text-xs text-[var(--text-tertiary)]">
        Hiviex — dúvidas técnicas profundas: repositório da tua organização ou notas de release.
      </p>
    </div>
  )
}
