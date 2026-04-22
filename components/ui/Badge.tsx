import type { ReactNode } from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'accent' | 'info'

const variants: Record<BadgeVariant, string> = {
  success:
    'bg-[var(--success-muted)] text-[var(--success)] ring-1 ring-inset ring-[var(--success)]/20',
  warning:
    'bg-[var(--warning-muted)] text-[var(--warning)] ring-1 ring-inset ring-[var(--warning)]/25',
  danger:
    'bg-[var(--danger-muted)] text-[var(--danger)] ring-1 ring-inset ring-[var(--danger)]/20',
  neutral:
    'bg-[var(--surface-base)] text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--border-subtle)]',
  accent:
    'bg-[var(--accent-muted)] text-[var(--accent)] ring-1 ring-inset ring-[var(--accent)]/20',
  info: 'bg-[var(--accent-muted)] text-[var(--accent)] ring-1 ring-inset ring-[var(--accent)]/15',
}

type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
