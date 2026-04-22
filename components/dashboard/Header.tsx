/**
 * Dashboard Header Component
 * 
 * Top header bar with user menu and notifications
 */

'use client'

import { signOut, useSession } from 'next-auth/react'
import { LogOut, Settings, Sun, Moon, Search } from 'lucide-react'
import Link from 'next/link'
import { useCommandPalette } from '@/contexts/CommandPaletteContext'
import { useState, useEffect } from 'react'
import { useThemeDetection } from '@/hooks/useThemeDetection'

export default function DashboardHeader() {
  const { data: session } = useSession()
  const { setOpen: openCommandPalette } = useCommandPalette()
  const [showMenu, setShowMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const theme = useThemeDetection()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 px-4 sm:px-8 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="shrink-0">
            <h1 className="text-lg sm:text-xl font-bold gradient-text tracking-tight">
              HIVIEX
            </h1>
          </Link>
          <button
            type="button"
            onClick={() => openCommandPalette(true)}
            className="hidden md:flex items-center gap-2 flex-1 max-w-md px-3 py-2 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 text-sm text-gray-500 hover:border-gray-300 dark:hover:border-white/20 transition-colors"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="truncate">Buscar ou ir para…</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-gray-400">
              ⌘K
            </kbd>
          </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => openCommandPalette(true)}
            className="md:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Abrir busca"
          >
            <Search className="w-5 h-5 text-black dark:text-white" />
          </button>
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-black dark:text-white" />
              ) : (
                <Moon className="w-5 h-5 text-black dark:text-white" />
              )}
            </button>
          )}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
            <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-sm font-medium">
              {session?.user?.name?.charAt(0).toUpperCase() ||
                session?.user?.email?.charAt(0).toUpperCase() ||
                'U'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-black dark:text-white">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {session?.user?.email}
              </p>
            </div>
          </button>

          {showMenu && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Fechar menu"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/50 dark:border-white/10 py-2 z-50">
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => setShowMenu(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}

