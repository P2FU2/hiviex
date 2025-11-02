'use client'

import { useEffect, useRef, useState } from 'react'

export default function Cursor() {
  const elRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('ontouchstart' in window) return
    
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const el = elRef.current
    if (!el) return

    // Detectar tema
    const getTheme = () => {
      const htmlTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      return savedTheme || htmlTheme || 'dark'
    }
    
    setTheme(getTheme())
    
    // Observar mudanças de tema
    const themeObserver = new MutationObserver(() => {
      setTheme(getTheme())
    })
    
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // Configurar estilo inicial
    el.style.transformOrigin = '0 0'
    el.style.opacity = '0'
    
    let raf = 0
    let mouseX = 0
    let mouseY = 0
    let currentX = 0
    let currentY = 0
    let currentScale = 1
    let isVisible = false

    const animate = () => {
      if (el && isVisible) {
        currentX += (mouseX - currentX) * 0.2
        currentY += (mouseY - currentY) * 0.2
        
        const targetScale = isHovering ? 1.15 : 1
        currentScale += (targetScale - currentScale) * 0.25
        
        el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentScale})`
      }
      raf = requestAnimationFrame(animate)
    }
    
    animate()

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      
      if (!isVisible && el) {
        isVisible = true
        currentX = mouseX
        currentY = mouseY
        el.style.opacity = '1'
      }
    }

    const INTERACTIVE = 'a,button,[role="button"],input,textarea,select,summary,label'
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Element | null
      const hovering = !!t?.closest(INTERACTIVE)
      setIsHovering(hovering)
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
    document.addEventListener('mouseover', onPointer, { passive: true })
    document.addEventListener('mouseout', onPointer, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave, { passive: true })
    document.body.addEventListener('mouseenter', onMouseEnter, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      themeObserver.disconnect()
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onPointer)
      document.removeEventListener('mouseout', onPointer)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.body.removeEventListener('mouseenter', onMouseEnter)
    }
  }, [mounted, isHovering])

  if (!mounted) return null

  const cursorColor = theme === 'dark' ? '#ffffff' : '#000000'

  return (
    <div
      ref={elRef}
      className="fixed z-[99999] will-change-transform pointer-events-none"
      style={{
        left: 0,
        top: 0,
      }}
      aria-hidden="true"
    >

      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 20.9999L4 3.99994L21 10.9999L14.7353 13.6848C14.2633 13.8871 13.8872 14.2632 13.6849 14.7353L11 20.9999Z" fill={cursorColor} stroke={cursorColor} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}
