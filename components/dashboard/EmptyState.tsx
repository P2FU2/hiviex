import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)]/60 px-6 py-16 text-center backdrop-blur-sm sm:px-12">
      {Icon ? (
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
          aria-hidden
        >
          <Icon className="h-7 w-7" strokeWidth={1.5} />
        </div>
      ) : null}
      <h3 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">{description}</p>
      ) : null}
      {action ? <div className="mt-8 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  )
}
