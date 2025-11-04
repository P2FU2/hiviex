/**
 * Dashboard Header Component
 * 
 * Top header bar with user menu and notifications
 */

'use client'

import { signOut, useSession } from 'next-auth/react'
import { User, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'

export default function DashboardHeader() {
  const { data: session } = useSession()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-black dark:text-white">
            Dashboard
          </h1>
        </div>
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
    </header>
  )
}

