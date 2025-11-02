'use client'

/**
 * Header Component
 * 
 * Fixed navigation header that appears after scrolling past threshold.
 * Features theme toggle, responsive mobile menu, and smooth animations.
 * 
 * @component
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react'
import { useScrollVisibility } from '@/hooks/useScrollVisibility'
import { useThemeDetection } from '@/hooks/useThemeDetection'
import { useAuth } from '@/contexts/AuthContext'
import { HEADER, ANIMATION_DURATION, THEME_STORAGE_KEY } from '@/lib/constants'

export default function Header() {
  const isVisible = useScrollVisibility(HEADER.SCROLL_THRESHOLD)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const theme = useThemeDetection()
  const { isAuthenticated, user, openAuthModal, logout } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Close mobile menu when scrolling
    if (isVisible) {
      setIsMobileMenuOpen(false)
    }
  }, [isVisible])

  /**
   * Toggles between light and dark theme
   */
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  if (!mounted) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: HEADER.ANIMATION_DURATION }}
          className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10"
        >
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-2xl font-bold gradient-text">
                HIVIEX
              </Link>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-6">
                <Link href="#content" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                  Pricing
                </Link>
                {isAuthenticated ? (
                  <>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {user?.name || user?.email}
                    </span>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => openAuthModal('signup')}
                      className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
                    >
                      Sign Up
                    </button>
                  </>
                )}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="md:hidden overflow-hidden"
                >
                  <div className="py-4 space-y-4">
                    <Link
                      href="#content"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Features
                    </Link>
                    <Link
                      href="#pricing"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          {user?.name || user?.email}
                        </div>
                        <button
                          onClick={() => {
                            logout()
                            setIsMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            openAuthModal('login')
                            setIsMobileMenuOpen(false)
                          }}
                          className="block w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                        >
                          Login
                        </button>
                        <button
                          onClick={() => {
                            openAuthModal('signup')
                            setIsMobileMenuOpen(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm font-medium text-white bg-black dark:bg-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
                        >
                          Sign Up
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </motion.header>
      )}
    </AnimatePresence>
  )
}

