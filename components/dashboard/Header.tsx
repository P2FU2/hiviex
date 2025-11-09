/**
 * Dashboard Header Component
 * 
 * Top header bar with user menu and notifications
 */

'use client'

import { signOut, useSession } from 'next-auth/react'
import { User, LogOut, Settings, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useThemeDetection } from '@/hooks/useThemeDetection'

export default function DashboardHeader() {
  const { data: session } = useSession()
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
    <header className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold gradient-text">
            HIVIEX
          </h1>
        </div>
        <div className="flex items-center gap-3">
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
            <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-black/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 dark:border-white/10 py-2 z-50">
              <a
                href="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Settings className="w-4 h-4" />
                Settings
              </a>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}

