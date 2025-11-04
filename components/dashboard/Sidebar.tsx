/**
 * Dashboard Sidebar Component
 * 
 * Navigation sidebar for dashboard pages
 */

'use client'

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
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workspaces', href: '/dashboard/workspaces', icon: Users },
  { name: 'Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Workflows', href: '/dashboard/workflows', icon: Workflow },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-white/10 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold gradient-text">
          HIVIEX
        </h2>
      </div>
      <nav className="px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isActive
                    ? 'bg-black/10 dark:bg-white/10 text-black dark:text-white border-l-2 border-black dark:border-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

