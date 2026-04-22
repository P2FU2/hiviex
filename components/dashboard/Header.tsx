/**
 * Top bar — alinhamento, busca (⌘K), tema, utilizador.
 */

'use client'

import { signOut, useSession } from 'next-auth/react'
import { LogOut, Settings, Sun, Moon, Search } from 'lucide-react'
import Link from 'next/link'
import { useCommandPalette } from '@/contexts/CommandPaletteContext'
import { useState, useEffect } from 'react'
import { useThemeDetection } from '@/hooks/useThemeDetection'
import { THEME_STORAGE_KEY } from '@/lib/constants'

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
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--surface-elevated)]/70">
      <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href="/dashboard"
            className="shrink-0 text-sm font-semibold tracking-tight text-[var(--text-primary)] transition-opacity hover:opacity-80"
          >
            Hiviex
          </Link>
          <button
            type="button"
            onClick={() => openCommandPalette(true)}
            className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)]/80 px-3 py-2 text-left text-sm text-[var(--text-tertiary)] transition-premium hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)] md:flex md:max-w-md"
          >
            <Search className="h-4 w-4 shrink-0 opacity-70" />
            <span className="truncate">Buscar ou navegar…</span>
            <kbd className="ml-auto hidden rounded border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)] sm:inline-block">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => openCommandPalette(true)}
            className="rounded-lg p-2 text-[var(--text-secondary)] transition-premium hover:bg-[var(--accent-muted)] hover:text-[var(--text-primary)] md:hidden"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>

          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-[var(--text-secondary)] transition-premium hover:bg-[var(--accent-muted)] hover:text-[var(--text-primary)]"
              aria-label="Tema"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 transition-premium hover:bg-[var(--surface-base)] sm:gap-3 sm:pr-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--text-primary)] text-xs font-medium text-[var(--surface-elevated)] dark:bg-white dark:text-zinc-900">
                {session?.user?.name?.charAt(0).toUpperCase() ||
                  session?.user?.email?.charAt(0).toUpperCase() ||
                  'U'}
              </div>
              <div className="hidden text-left md:block">
                <p className="max-w-[140px] truncate text-sm font-medium text-[var(--text-primary)]">
                  {session?.user?.name || 'Conta'}
                </p>
                <p className="max-w-[140px] truncate text-xs text-[var(--text-tertiary)]">
                  {session?.user?.email}
                </p>
              </div>
            </button>

            {showMenu ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40"
                  aria-label="Fechar menu"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-1 shadow-premium-md">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-base)] hover:text-[var(--text-primary)]"
                    onClick={() => setShowMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Definições
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--danger)] transition-colors hover:bg-[var(--danger-muted)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
