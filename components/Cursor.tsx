'use client'

/**
 * Cursor personalizado (landing / páginas marketing).
 * Seta no vazio; mão preta em elementos interativos (igual ao cursor CSS no dashboard).
 */

import { useEffect, useRef, useState } from 'react'
import { useThemeDetection } from '@/hooks/useThemeDetection'
import { CURSOR } from '@/lib/constants'

function HandIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </g>
    </svg>
  )
}

export default function Cursor() {
  const elRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [hovering, setHovering] = useState(false)
  const theme = useThemeDetection()
  const hoverAnimRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('ontouchstart' in window) return

    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const el = elRef.current
    if (!el) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const posSmooth = reduceMotion ? 1 : CURSOR.SMOOTHNESS
    const scaleSmooth = reduceMotion ? 1 : CURSOR.SCALE_SMOOTH

    el.style.transformOrigin = '0 0'
    el.style.opacity = '0'
    el.style.contain = 'layout style'

    let raf = 0
    let mouseX = 0
    let mouseY = 0
    let currentX = 0
    let currentY = 0
    let currentScale = 1
    let isVisible = false

    const animate = () => {
      if (el && isVisible) {
        currentX += (mouseX - currentX) * posSmooth
        currentY += (mouseY - currentY) * posSmooth

        const targetScale = hoverAnimRef.current ? CURSOR.SCALE_ON_HOVER : 1
        currentScale += (targetScale - currentScale) * scaleSmooth

        el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentScale})`
      }
      raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      const t = e.target as Element | null
      const h = !!t?.closest(CURSOR.INTERACTIVE_SELECTORS)
      hoverAnimRef.current = h
      setHovering((prev) => (prev === h ? prev : h))

      if (!isVisible && el) {
        isVisible = true
        currentX = mouseX
        currentY = mouseY
        el.style.opacity = '1'
      }
    }

    const onMouseLeave = () => {
      if (el) {
        el.style.opacity = '0'
        isVisible = false
      }
    }

    const onMouseEnter = () => {
      if (el) {
        el.style.opacity = '1'
        isVisible = true
      }
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave, { passive: true })
    document.body.addEventListener('mouseenter', onMouseEnter, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.body.removeEventListener('mouseenter', onMouseEnter)
    }
  }, [mounted])

  if (!mounted) return null

  const arrowColor = theme === 'dark' ? '#ffffff' : '#000000'
  const handClass = 'text-[#0a0a0a] drop-shadow-[0_0_0.5px_#f4f4f5] dark:drop-shadow-[0_0_0.5px_#3f3f46]'

  return (
    <div
      ref={elRef}
      className="pointer-events-none fixed will-change-transform"
      style={{
        left: 0,
        top: 0,
        zIndex: CURSOR.Z_INDEX,
      }}
      aria-hidden="true"
    >
      {hovering ? (
        <div className={handClass} style={{ width: CURSOR.SIZE + 4, height: CURSOR.SIZE + 4 }}>
          <HandIcon size={CURSOR.SIZE + 2} />
        </div>
      ) : (
        <svg
          width={CURSOR.SIZE}
          height={CURSOR.SIZE}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 20.9999L4 3.99994L21 10.9999L14.7353 13.6848C14.2633 13.8871 13.8872 14.2632 13.6849 14.7353L11 20.9999Z"
            fill={arrowColor}
            stroke={arrowColor}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}
