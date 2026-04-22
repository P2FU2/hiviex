/**
 * Sidebar — navegação compacta, estado colapsável, hierarquia clara.
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  Bot,
  MessageSquare,
  Workflow,
  Settings,
  CreditCard,
  GitBranch,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Library,
  Sparkles,
  Book,
  Plug,
  CalendarDays,
  Images,
  Activity,
  Clapperboard,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'

const STORAGE_KEY = 'hiviex-sidebar-collapsed'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  submenu?: NavItem[]
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workspaces', href: '/dashboard/workspaces', icon: Users },
  {
    name: 'Agents',
    href: '/dashboard/agents',
    icon: Bot,
    submenu: [
      { name: 'Todos os Agentes', href: '/dashboard/agents', icon: Bot },
      { name: 'Biblioteca', href: '/dashboard/agents/library', icon: Library },
      { name: 'Criar Agente', href: '/dashboard/agents/new', icon: Sparkles },
      { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
    ],
  },
  {
    name: 'Workflows',
    href: '/dashboard/workflows',
    icon: Workflow,
    submenu: [
      { name: 'Meus Workflows', href: '/dashboard/workflows', icon: Workflow },
      { name: 'Criar Workflow', href: '/dashboard/workflows/new', icon: Sparkles },
      { name: 'Flow Builder', href: '/dashboard/flows', icon: GitBranch },
      { name: 'Criar Flow', href: '/dashboard/flows/new', icon: Sparkles },
      { name: 'Execuções', href: '/dashboard/flows/executions', icon: GitBranch },
    ],
  },
  { name: 'Integrações', href: '/dashboard/integrations', icon: Plug },
  { name: 'Calendário', href: '/dashboard/calendar', icon: CalendarDays },
  { name: 'Mídia', href: '/dashboard/media', icon: Images },
  { name: 'Influenciadores AI', href: '/dashboard/influencers', icon: Sparkles },
  { name: 'Vídeo', href: '/dashboard/video', icon: Clapperboard },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    submenu: [
      { name: 'Dashboard', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Relatórios', href: '/dashboard/analytics/reports', icon: BarChart3 },
      { name: 'Métricas', href: '/dashboard/analytics/metrics', icon: BarChart3 },
    ],
  },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Sistema', href: '/dashboard/status', icon: Activity },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Guias', href: '/dashboard/guides', icon: Book },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1') {
        setCollapsed(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const isActive = (href: string) => {
    if (pathname === href) return true
    if (pathname?.startsWith(href + '/')) {
      const allHrefs = navigation
        .flatMap((item) => [item.href, ...(item.submenu?.map((s) => s.href) || [])])
        .filter((h) => h !== href)
      const moreSpecific = allHrefs.some((h) => pathname?.startsWith(h + '/') || pathname === h)
      return !moreSpecific
    }
    return false
  }

  const shouldAutoExpand = (item: NavItem) =>
    !!item.submenu?.some((sub) => isActive(sub.href))

  const widthCls = collapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]'

  return (
    <aside
      className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-elevated)]/90 backdrop-blur-md transition-[width] duration-200 ease-out-expo sm:flex ${widthCls}`}
    >
      <div className={`flex items-center border-b border-[var(--border-subtle)] py-2 ${collapsed ? 'justify-center px-1' : 'justify-end px-2'}`}>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--accent-muted)] hover:text-[var(--text-primary)]"
          title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navigation.map((item) => {
            const hasSubmenu = !!(item.submenu && item.submenu.length > 0)
            const itemActive = isActive(item.href) || shouldAutoExpand(item)
            const expanded = expandedMenus.has(item.name) || shouldAutoExpand(item)

            if (hasSubmenu && collapsed) {
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={item.name}
                    className={`flex items-center justify-center rounded-lg p-2.5 transition-premium ${
                      itemActive
                        ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-base)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                  </Link>
                </li>
              )
            }

            if (hasSubmenu) {
              return (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.name)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-premium ${
                      itemActive
                        ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-base)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0 opacity-90" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                    )}
                  </button>
                  {expanded && (
                    <ul className="ml-2 mt-0.5 space-y-0.5 border-l border-[var(--border-subtle)] pl-2">
                      {item.submenu!.map((sub) => {
                        const subActive = isActive(sub.href)
                        return (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-premium ${
                                subActive
                                  ? 'font-medium text-[var(--accent)]'
                                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <sub.icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                              <span className="truncate">{sub.name}</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            }

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-premium ${
                    collapsed ? 'justify-center px-2' : ''
                  } ${
                    itemActive
                      ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-base)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                  {!collapsed ? <span className="truncate">{item.name}</span> : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
