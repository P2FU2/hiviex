/**
 * Custom hook for scroll-based visibility
 * Shows/hides element based on scroll position threshold
 * 
 * @param threshold - Scroll position in pixels to trigger visibility (default: 300)
 * @returns Boolean indicating if element should be visible
 */

import { useState, useEffect } from 'react'
import { HEADER } from '@/lib/constants'

export function useScrollVisibility(threshold: number = HEADER.SCROLL_THRESHOLD): boolean {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial position

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return isVisible
}

