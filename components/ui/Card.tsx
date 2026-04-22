import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

const pad = { sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' }

/** Container padrão: borda fina, sem sombra pesada (estilo Linear/Vercel). */
export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80 backdrop-blur-sm ${pad[padding]} ${className}`}
    >
      {children}
    </div>
  )
}
