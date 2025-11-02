/**
 * Custom hook for tracking mouse position
 * Provides normalized mouse coordinates relative to viewport
 * 
 * @returns Mouse position with normalized x and y values
 */

import { useState, useEffect } from 'react'
import { MousePosition } from '@/lib/types'
import { MOUSE_TRACKING } from '@/lib/constants'

/**
 * Custom hook to track mouse position and normalize coordinates
 * @returns Normalized mouse position relative to viewport center
 */
export function useMousePosition(): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * MOUSE_TRACKING.POSITION_MULTIPLIER,
        y: (e.clientY / window.innerHeight - 0.5) * MOUSE_TRACKING.POSITION_MULTIPLIER,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return mousePosition
}

