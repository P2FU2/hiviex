/**
 * Centraliza resolução de segredos para auth / OAuth state.
 * Em produção em runtime, NEXTAUTH_SECRET é obrigatório e deve ser forte.
 * Durante `next build`, NODE_ENV=production mas não há secrets — não falhar.
 */

function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

export function getNextAuthSecret(): string {
  const s = process.env.NEXTAUTH_SECRET
  const strictProd =
    process.env.NODE_ENV === 'production' && !isNextProductionBuild()

  if (strictProd) {
    if (!s || s.length < 32) {
      throw new Error(
        'NEXTAUTH_SECRET must be set to a random string of at least 32 characters in production'
      )
    }
    return s
  }
  return s || 'development-only-nextauth-secret-min-32-chars!!'
}

/** HMAC do OAuth state: pode reutilizar NEXTAUTH_SECRET ou OAUTH_STATE_SECRET dedicado. */
export function getOAuthStateSecret(): string {
  const s = process.env.OAUTH_STATE_SECRET || process.env.NEXTAUTH_SECRET
  const strictProd =
    process.env.NODE_ENV === 'production' && !isNextProductionBuild()

  if (strictProd) {
    if (!s || s.length < 32) {
      throw new Error(
        'OAUTH_STATE_SECRET or NEXTAUTH_SECRET (min 32 chars) is required in production for OAuth CSRF protection'
      )
    }
    return s
  }
  return s || 'development-oauth-state-secret-min-32-chars!!'
}
