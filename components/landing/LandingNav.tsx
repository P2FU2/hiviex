'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useThemeDetection } from '@/hooks/useThemeDetection'
import { useAuth } from '@/contexts/AuthContext'
import { THEME_STORAGE_KEY } from '@/lib/constants'

export default function LandingNav() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const theme = useThemeDetection()
  const { isAuthenticated, openAuthModal } = useAuth()

  useEffect(() => setMounted(true), [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(next)
    localStorage.setItem(THEME_STORAGE_KEY, next)
  }

  const links = [
    { href: '#produto', label: 'Produto' },
    { href: '#resultados', label: 'Resultados' },
    { href: '#precos', label: 'Preços' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--surface-elevated)]/65">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-[var(--text-primary)] transition-opacity hover:opacity-80"
        >
          Hiviex
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--text-secondary)] transition-colors duration-fast hover:text-[var(--text-primary)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-muted)] hover:text-[var(--text-primary)]"
              aria-label="Tema"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
          <div className="hidden items-center gap-2 sm:flex">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] dark:text-[var(--accent-foreground)]"
              >
                Abrir app
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--surface-elevated)] transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-900"
                >
                  Começar
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            className="rounded-lg p-2 md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-[var(--text-secondary)]"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            {isAuthenticated ? (
              <Link href="/dashboard" className="text-sm font-medium text-[var(--accent)]" onClick={() => setOpen(false)}>
                Abrir app
              </Link>
            ) : (
              <>
                <button type="button" className="text-left text-sm" onClick={() => { openAuthModal('login'); setOpen(false) }}>
                  Entrar
                </button>
                <button
                  type="button"
                  className="text-left text-sm font-medium text-[var(--accent)]"
                  onClick={() => { openAuthModal('signup'); setOpen(false) }}
                >
                  Começar
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
