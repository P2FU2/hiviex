'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  LayoutDashboard,
  Bot,
  GitBranch,
  Users,
  Plug,
  BarChart3,
  CreditCard,
  Settings,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CalendarDays,
  Images,
  Activity,
  Code2,
  Clapperboard,
  Workflow,
  Book,
  Library,
} from 'lucide-react'
import { useCommandPalette } from '@/contexts/CommandPaletteContext'

type Tenant = { id: string; name: string; slug: string }

/** Mesma lógica de prioridade que o menu lateral (config IA → criar → conteúdo → canais → escala). */
const STATIC_LINKS: { label: string; href: string; icon: typeof LayoutDashboard; keywords: string }[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: 'início home' },
  { label: 'Workspaces', href: '/dashboard/workspaces', icon: Users, keywords: 'equipa tenant' },
  { label: 'Guias', href: '/dashboard/guides', icon: Book, keywords: 'manual ajuda trilha aprender' },
  { label: 'APIs e IA', href: '/dashboard/apis', icon: Code2, keywords: 'openai anthropic cohere chaves llm' },
  { label: 'Agentes de IA', href: '/dashboard/agents', icon: Bot, keywords: 'ai personas' },
  { label: 'Novo agente', href: '/dashboard/agents/new', icon: Sparkles, keywords: 'criar' },
  { label: 'Biblioteca de agentes', href: '/dashboard/agents/library', icon: Library, keywords: 'templates modelos' },
  { label: 'Chat', href: '/dashboard/chat', icon: MessageSquare, keywords: 'conversa' },
  { label: 'Workflows', href: '/dashboard/workflows', icon: Workflow, keywords: 'lista fluxos' },
  { label: 'Flow Builder', href: '/dashboard/flows', icon: GitBranch, keywords: 'automação canvas nós' },
  { label: 'Novo flow', href: '/dashboard/flows/new', icon: Sparkles, keywords: 'criar flow' },
  { label: 'Novo workflow', href: '/dashboard/workflows/new', icon: Sparkles, keywords: 'criar workflow' },
  { label: 'Execuções de flows', href: '/dashboard/flows/executions', icon: GitBranch, keywords: 'histórico runs' },
  { label: 'Biblioteca de mídia', href: '/dashboard/media', icon: Images, keywords: 'upload s3 r2 ficheiros' },
  { label: 'Calendário editorial', href: '/dashboard/calendar', icon: CalendarDays, keywords: 'agendar posts conteúdo' },
  { label: 'Integrações sociais', href: '/dashboard/integrations', icon: Plug, keywords: 'oauth instagram youtube facebook' },
  { label: 'Influenciadores AI', href: '/dashboard/influencers', icon: Sparkles, keywords: 'persona versões' },
  { label: 'Vídeo', href: '/dashboard/video', icon: Clapperboard, keywords: 'projeto transcribe cortes' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, keywords: 'métricas relatórios' },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard, keywords: 'plano pagamento stripe' },
  { label: 'Estado do sistema', href: '/dashboard/status', icon: Activity, keywords: 'sentry health redis postgres observabilidade' },
  { label: 'Definições', href: '/dashboard/settings', icon: Settings, keywords: 'conta perfil' },
]

export default function CommandPalette() {
  const { open, setOpen } = useCommandPalette()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [tenants, setTenants] = useState<Tenant[]>([])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    const t = requestAnimationFrame(() => inputRef.current?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  useEffect(() => {
    if (!open) return
    fetch('/api/workspaces')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.tenants)) {
          setTenants(
            data.tenants.map((m: { tenant: Tenant }) => m.tenant).filter(Boolean)
          )
        }
      })
      .catch(() => setTenants([]))
  }, [open])

  const q = query.trim().toLowerCase()

  const filteredStatic = useMemo(() => {
    if (!q) return STATIC_LINKS
    return STATIC_LINKS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    )
  }, [q])

  const filteredWorkspaces = useMemo(() => {
    if (!q) return tenants.slice(0, 5)
    return tenants
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [tenants, q])

  const navigate = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router, setOpen]
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-xl rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 shadow-2xl shadow-black/20 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200/60 dark:border-white/10">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ir para… (páginas, integrações, workspaces)"
            className="flex-1 bg-transparent text-black dark:text-white placeholder:text-gray-500 outline-none text-sm"
          />
          <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border border-gray-300 dark:border-white/20 text-gray-500">
            Esc
          </kbd>
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto py-2">
          {filteredWorkspaces.length > 0 && (
            <div className="px-2 pb-2">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Workspaces
              </p>
              {filteredWorkspaces.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/workspaces/${t.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <Users className="w-4 h-4 text-violet-500 shrink-0" />
                  <span className="text-sm font-medium text-black dark:text-white truncate">
                    {t.name}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-auto text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
          <div className="px-2">
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Navegação
            </p>
            {filteredStatic.length === 0 ? (
              <p className="px-3 py-6 text-sm text-gray-500 text-center">
                Nenhum resultado.
              </p>
            ) : (
              filteredStatic.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <item.icon className="w-4 h-4 text-gray-600 dark:text-gray-400 shrink-0" />
                  <span className="text-sm text-black dark:text-white">{item.label}</span>
                  <ArrowRight className="w-4 h-4 ml-auto text-gray-400 opacity-0 group-hover:opacity-100" />
                </Link>
              ))
            )}
          </div>
        </div>
        <div className="px-4 py-2 border-t border-gray-200/60 dark:border-white/10 text-[10px] text-gray-500 flex justify-between">
          <span>Hiviex</span>
          <span>
            <kbd className="px-1 rounded bg-gray-100 dark:bg-white/10">⌘</kbd>
            <kbd className="px-1 rounded bg-gray-100 dark:bg-white/10 ml-0.5">K</kbd>
            {' '}abrir
          </span>
        </div>
      </div>
    </div>
  )
}
