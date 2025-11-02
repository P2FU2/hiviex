'use client'

/**
 * Custom Cursor Component
 * 
 * Provides a custom arrow cursor that follows mouse movement with smooth animation.
 * Changes appearance based on theme and scales up when hovering interactive elements.
 * 
 * Features:
 * - Smooth following animation using requestAnimationFrame
 * - Theme-aware coloring (white for dark theme, black for light theme)
 * - Automatic detection of interactive elements
 * - Hidden on touch devices
 * 
 * @component
 */

import { useEffect, useRef, useState } from 'react'
import { useThemeDetection } from '@/hooks/useThemeDetection'
import { CURSOR, THEME_STORAGE_KEY, DEFAULT_THEME } from '@/lib/constants'
import { Theme } from '@/lib/types'

export default function Cursor() {
  const elRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const theme = useThemeDetection()

  // Only render on client and non-touch devices
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('ontouchstart' in window) return
    
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const el = elRef.current
    if (!el) return

    // Initialize cursor styles
    el.style.transformOrigin = '0 0'
    el.style.opacity = '0'
    
    // Animation state variables
    let raf = 0
    let mouseX = 0
    let mouseY = 0
    let currentX = 0
    let currentY = 0
    let currentScale = 1
    let isVisible = false

    /**
     * Animation loop using requestAnimationFrame for smooth movement
     * Implements easing for natural cursor following
     */
    const animate = () => {
      if (el && isVisible) {
        // Smooth interpolation for cursor position
        currentX += (mouseX - currentX) * CURSOR.SMOOTHNESS
        currentY += (mouseY - currentY) * CURSOR.SMOOTHNESS
        
        // Smooth scale transition on hover
        const targetScale = isHovering ? CURSOR.SCALE_ON_HOVER : 1
        currentScale += (targetScale - currentScale) * 0.25
        
        el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentScale})`
      }
      raf = requestAnimationFrame(animate)
    }
    
    animate()

    /**
     * Mouse move handler - updates target position and shows cursor
     */
    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      
      // Show cursor on first movement
      if (!isVisible && el) {
        isVisible = true
        currentX = mouseX
        currentY = mouseY
        el.style.opacity = '1'
      }
    }

    /**
     * Detects if cursor is over an interactive element
     */
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Element | null
      const hovering = !!target?.closest(CURSOR.INTERACTIVE_SELECTORS)
      setIsHovering(hovering)
    }

    /**
     * Hide cursor when mouse leaves the window
     */
    const onMouseLeave = () => {
      if (el) {
        el.style.opacity = '0'
        isVisible = false
      }
    }
    
    /**
     * Show cursor when mouse enters the window
     */
    const onMouseEnter = () => {
      if (el) {
        el.style.opacity = '1'
        isVisible = true
      }
    }

    // Event listeners with passive flag for better performance
    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onPointer, { passive: true })
    document.addEventListener('mouseout', onPointer, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave, { passive: true })
    document.body.addEventListener('mouseenter', onMouseEnter, { passive: true })

    // Cleanup
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onPointer)
      document.removeEventListener('mouseout', onPointer)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.body.removeEventListener('mouseenter', onMouseEnter)
    }
  }, [mounted, isHovering])

  // Don't render on server or touch devices
  if (!mounted) return null

  const cursorColor = theme === 'dark' ? '#ffffff' : '#000000'

  return (
    <div
      ref={elRef}
      className="fixed will-change-transform pointer-events-none"
      style={{
        left: 0,
        top: 0,
        zIndex: CURSOR.Z_INDEX,
      }}
      aria-hidden="true"
    >
      <svg 
        width={CURSOR.SIZE} 
        height={CURSOR.SIZE} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M11 20.9999L4 3.99994L21 10.9999L14.7353 13.6848C14.2633 13.8871 13.8872 14.2632 13.6849 14.7353L11 20.9999Z" 
          fill={cursorColor} 
          stroke={cursorColor} 
          strokeWidth="1" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
