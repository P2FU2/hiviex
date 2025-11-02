/**
 * Custom hook for theme management
 * Detects theme from DOM and localStorage
 * 
 * @returns Current theme and toggle function
 */

import { useState, useEffect } from 'react'
import { Theme } from '@/lib/types'
import { THEME_STORAGE_KEY, DEFAULT_THEME } from '@/lib/constants'

/**
 * Detects the current theme from DOM classes and localStorage
 * @returns The current theme ('light' or 'dark')
 */
const detectTheme = (): Theme => {
  if (typeof window === 'undefined') return DEFAULT_THEME
  
  const htmlTheme = document.documentElement.classList.contains('dark') 
    ? 'dark' 
    : 'light'
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
  
  return savedTheme || htmlTheme || DEFAULT_THEME
}

/**
 * Custom hook to detect and observe theme changes
 * Uses MutationObserver to detect DOM class changes
 * 
 * @returns Current theme value
 */
export function useThemeDetection(): Theme {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME
    return detectTheme()
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initial theme detection
    setTheme(detectTheme())

    // Observe theme changes in DOM
    const observer = new MutationObserver(() => {
      setTheme(detectTheme())
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return theme
}

