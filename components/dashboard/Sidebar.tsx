/**
 * Dashboard Sidebar Component
 * 
 * Navigation sidebar with expandable submenus
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Brain,
  User,
  Play,
  History,
  FileText,
  Sparkles,
  Book,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: any
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
      { name: '─', href: '#', icon: GitBranch },
      { name: 'Flow Builder', href: '/dashboard/flows', icon: GitBranch },
      { name: 'Criar Flow', href: '/dashboard/flows/new', icon: Sparkles },
      { name: 'Execuções', href: '/dashboard/flows/executions', icon: History },
    ],
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    submenu: [
      { name: 'Dashboard', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Relatórios', href: '/dashboard/analytics/reports', icon: FileText },
      { name: 'Métricas', href: '/dashboard/analytics/metrics', icon: BarChart3 },
    ],
  },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Guias', href: '/dashboard/guides', icon: Book },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  const toggleMenu = (name: string) => {
    const newExpanded = new Set(expandedMenus)
    if (newExpanded.has(name)) {
      newExpanded.delete(name)
    } else {
      newExpanded.add(name)
    }
    setExpandedMenus(newExpanded)
  }

  const isActive = (href: string) => {
    // Exact match or starts with (but not for parent items when child is active)
    if (pathname === href) return true
    // Only match if it's a sub-path, not if it's a parent of another active item
    if (pathname?.startsWith(href + '/')) {
      // Check if this is the most specific match
      const allHrefs = navigation.flatMap(item => [
        item.href,
        ...(item.submenu?.map(sub => sub.href) || [])
      ]).filter(h => h !== href)
      
      // If another more specific href matches, this one shouldn't be active
      const moreSpecificMatch = allHrefs.some(h => 
        pathname?.startsWith(h + '/') || pathname === h
      )
      
      return !moreSpecificMatch
    }
    return false
  }

  const isMenuExpanded = (name: string) => {
    return expandedMenus.has(name)
  }

  // Auto-expand menus if current path matches
  const shouldAutoExpand = (item: NavItem) => {
    if (!item.submenu) return false
    return item.submenu.some((sub) => isActive(sub.href))
  }

  return (
    <aside className="w-64 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-white/10 min-h-screen">
      <nav className="px-4 pt-6 space-y-1">
        {navigation.map((item) => {
          const hasSubmenu = item.submenu && item.submenu.length > 0
          const isItemActive = isActive(item.href) || shouldAutoExpand(item)
          const isExpanded = isMenuExpanded(item.name) || shouldAutoExpand(item)

          return (
            <div key={item.name}>
              {hasSubmenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`
                      w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors
                      ${
                        isItemActive
                          ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.submenu?.map((subItem, index) => {
                        // Check if this is a separator
                        if (subItem.name === '─' || subItem.href === '#') {
                          return (
                            <div
                              key={`separator-${index}`}
                              className="my-2 border-t border-gray-200/50 dark:border-white/10"
                            />
                          )
                        }
                        const isSubActive = isActive(subItem.href)
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`
                              flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm
                              ${
                                isSubActive
                                  ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white border-l-2 border-black dark:border-white'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
                              }
                            `}
                          >
                            <subItem.icon className="w-4 h-4" />
                            <span>{subItem.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isItemActive
                        ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white border-l-2 border-black dark:border-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
