/**
 * Custom hook for 3D mouse interaction with an element
 * Calculates 3D rotation based on mouse position relative to element center
 * 
 * @param elementRef - Reference to the DOM element
 * @returns Rotation values for 3D transform and mouse position relative to element
 */

import { useEffect, useState, RefObject } from 'react'
import { Rotation3D, MousePosition } from '@/lib/types'
import { MOUSE_TRACKING } from '@/lib/constants'

interface UseElementMouse3DReturn {
  rotation: Rotation3D
  mousePosition: MousePosition
}

/**
 * Custom hook for 3D mouse interaction
 * @param elementRef - Reference to the target element
 * @returns Rotation and mouse position relative to element
 */
export function useElementMouse3D(
  elementRef: RefObject<HTMLElement>
): UseElementMouse3DReturn {
  const [rotation, setRotation] = useState<Rotation3D>({ x: 0, y: 0 })
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!elementRef.current) return

      const rect = elementRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const mouseX = e.clientX - centerX
      const mouseY = e.clientY - centerY

      setMousePosition({ x: mouseX, y: mouseY })

      // Calculate 3D rotation based on mouse position
      const rotateX = (mouseY / rect.height) * -MOUSE_TRACKING.ROTATION_INTENSITY
      const rotateY = (mouseX / rect.width) * MOUSE_TRACKING.ROTATION_INTENSITY

      setRotation({ x: rotateX, y: rotateY })
    }

    const handleMouseLeave = () => {
      setRotation({ x: 0, y: 0 })
      setMousePosition({ x: 0, y: 0 })
    }

    const element = elementRef.current
    if (element) {
      element.addEventListener('mousemove', handleMouseMove)
      element.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove)
        element.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [elementRef])

  return { rotation, mousePosition }
}

