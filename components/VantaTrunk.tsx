'use client'

/**
 * Vanta.js TRUNK Effect Component
 * 
 * Creates an animated 3D trunk-like background effect using Vanta.js.
 * Provides an interactive, dynamic background that responds to mouse movement.
 * 
 * @component
 */

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    VANTA?: {
      TRUNK: (options: {
        el: string | HTMLElement
        mouseControls?: boolean
        touchControls?: boolean
        gyroControls?: boolean
        minHeight?: number
        minWidth?: number
        scale?: number
        scaleMobile?: number
        color?: number
        chaos?: number
      }) => {
        destroy: () => void
      }
    }
    THREE?: any
  }
}

interface VantaTrunkProps {
  className?: string
  color?: number
  chaos?: number
}

/**
 * VantaTrunk Component
 * 
 * @param className - Additional CSS classes
 * @param color - Hex color value (default: 0xffffff - white)
 * @param chaos - Chaos level for animation (default: 6.0)
 */
export default function VantaTrunk({ 
  className = '', 
  color = 0xffffff,
  chaos = 6.0 
}: VantaTrunkProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    if (!containerRef.current) return

    let mounted = true

    // Check if scripts are already loaded
    const checkAndInit = () => {
      if (!mounted || !containerRef.current) return false
      
      // Vanta TRUNK needs Three.js, not p5.js
      if (window.VANTA && typeof window.VANTA.TRUNK === 'function' && (window as any).THREE) {
        initVanta()
        setIsLoaded(true)
        return true
      }
      return false
    }

    const initVanta = () => {
      if (!containerRef.current || !window.VANTA || typeof window.VANTA.TRUNK !== 'function') {
        console.warn('Vanta TRUNK not available')
        return
      }

      // Wait a bit to ensure element is fully rendered
      setTimeout(() => {
        if (!containerRef.current || !mounted) return

        // Destroy existing effect if any
        if (vantaEffect.current) {
          try {
            vantaEffect.current.destroy()
          } catch (e) {
            console.warn('Error destroying vanta effect:', e)
          }
          vantaEffect.current = null
        }

        try {
          // Initialize Vanta TRUNK effect
          if (!window.VANTA || typeof window.VANTA.TRUNK !== 'function') return
          vantaEffect.current = window.VANTA.TRUNK({
            el: containerRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color,
            chaos,
          })
          setIsLoaded(true)
        } catch (error) {
          console.error('Error initializing Vanta TRUNK:', error)
        }
      }, 100)
    }

    // Try to initialize immediately if scripts are already loaded
    if (checkAndInit()) {
      return
    }

    // Load Three.js first (required dependency for Vanta TRUNK)
    const loadThree = () => {
      return new Promise<void>((resolve) => {
        // Check if THREE is already loaded
        if ((window as any).THREE) {
          resolve()
          return
        }

        // Check if script is already being loaded
        const existingThree = document.querySelector('script[src*="three"]')
        if (existingThree) {
          // Wait for existing script to load
          const checkInterval = setInterval(() => {
            if ((window as any).THREE) {
              clearInterval(checkInterval)
              resolve()
            }
          }, 100)
          setTimeout(() => {
            clearInterval(checkInterval)
            // If still not loaded after timeout, proceed anyway
            resolve()
          }, 5000)
          return
        }

        // Load Three.js only if not already present
        const threeScript = document.createElement('script')
        threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
        threeScript.async = true
        threeScript.crossOrigin = 'anonymous'
        threeScript.id = 'three-js-script' // Add ID to prevent duplicates
        threeScript.onload = () => {
          // Wait for THREE to be available
          const checkThree = setInterval(() => {
            if ((window as any).THREE) {
              clearInterval(checkThree)
              resolve()
            }
          }, 50)
          setTimeout(() => {
            clearInterval(checkThree)
            resolve()
          }, 3000)
        }
        threeScript.onerror = () => {
          console.error('Failed to load Three.js')
          resolve()
        }
        document.head.appendChild(threeScript)
      })
    }

    // Load Vanta.js
    const loadVanta = () => {
      return new Promise<void>((resolve) => {
        if (window.VANTA && typeof window.VANTA.TRUNK === 'function') {
          resolve()
          return
        }

        const existingVanta = document.querySelector('script[src*="vanta"]')
        if (existingVanta) {
          const checkInterval = setInterval(() => {
            if (window.VANTA && typeof window.VANTA.TRUNK === 'function') {
              clearInterval(checkInterval)
              resolve()
            }
          }, 100)
          setTimeout(() => {
            clearInterval(checkInterval)
            resolve()
          }, 5000)
          return
        }

        const vantaScript = document.createElement('script')
        vantaScript.src = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.trunk.min.js'
        vantaScript.async = true
        vantaScript.crossOrigin = 'anonymous'
        vantaScript.onload = () => {
          // Wait for Vanta to be available
          const checkVanta = setInterval(() => {
            if (window.VANTA && typeof window.VANTA.TRUNK === 'function') {
              clearInterval(checkVanta)
              resolve()
            }
          }, 50)
          setTimeout(() => {
            clearInterval(checkVanta)
            resolve()
          }, 3000)
        }
        vantaScript.onerror = () => {
          console.error('Failed to load Vanta.js')
          resolve()
        }
        document.head.appendChild(vantaScript)
      })
    }

    // Load scripts in sequence
    loadThree()
      .then(() => loadVanta())
      .then(() => {
        if (mounted) {
          initVanta()
        }
      })
      .catch((error) => {
        console.error('Error loading Vanta scripts:', error)
      })

    // Cleanup function
    return () => {
      mounted = false
      if (vantaEffect.current) {
        try {
          vantaEffect.current.destroy()
        } catch (e) {
          console.warn('Error destroying vanta effect:', e)
        }
        vantaEffect.current = null
      }
    }
  }, [color, chaos])

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 ${className}`}
      style={{ 
        zIndex: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        minHeight: '400px',
      }}
    />
  )
}
