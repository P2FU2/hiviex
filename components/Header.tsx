'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Menu, X, Sun, Moon } from 'lucide-react'

export default function Header() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const getTheme = () => {
      if (typeof window !== 'undefined') {
        const htmlTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
        return savedTheme || htmlTheme || 'dark'
      }
      return 'dark'
    }
    
    setTheme(getTheme())
    
    const observer = new MutationObserver(() => {
      setTheme(getTheme())
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    const handleScroll = () => {
      setIsVisible(window.scrollY > 300)
      setIsMobileMenuOpen(false)
    }

    window.addEventListener('scroll', handleScroll)
    
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  if (!mounted) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10"
        >
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-2xl font-bold gradient-text">
                HIVIEX
              </Link>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-8">
                <Link href="#content" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                  Pricing
                </Link>
                <Link href="/privacy" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                  Terms
                </Link>
                <Link href="/cookies" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                  Cookies
                </Link>
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
                    <Link
                      href="/privacy"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Privacy
                    </Link>
                    <Link
                      href="/terms"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Terms
                    </Link>
                    <Link
                      href="/cookies"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Cookies
                    </Link>
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

