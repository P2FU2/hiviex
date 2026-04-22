/**
 * Classes reutilizáveis do dashboard — alinhadas ao design system (globals.css).
 * Evita divergência entre páginas e mantém foco/hover consistentes.
 */

/** CTA principal (acento da marca) */
export const dashBtnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] shadow-xs transition-premium hover:opacity-92 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'

/** Secundário: borda neutra, fundo elevado */
export const dashBtnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-premium hover:bg-[var(--surface-base)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45'

/** Ação em lista / ícone */
export const dashBtnGhost =
  'inline-flex items-center justify-center rounded-lg p-2 text-[var(--text-secondary)] transition-premium hover:bg-[var(--accent-muted)] hover:text-[var(--text-primary)] active:scale-[0.97]'

/** Link de texto com peso institucional */
export const dashLink =
  'text-sm font-medium text-[var(--accent)] transition-premium hover:underline underline-offset-4'

/** Campo de formulário padrão */
export const dashInput =
  'w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-premium focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)]'

/** Label */
export const dashLabel =
  'mb-2 block text-sm font-medium text-[var(--text-secondary)]'

/** Meta / kicker acima do título */
export const dashEyebrow =
  'text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]'

/** Cartão de lista / grelha — hover discreto */
export const dashInteractiveCard =
  'rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/90 p-5 transition-premium hover:border-[var(--border-strong)] hover:shadow-premium-sm'
