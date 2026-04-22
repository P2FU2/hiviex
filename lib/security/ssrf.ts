/**
 * Proteção SSRF para pedidos HTTP saídos (flows, webhooks internos).
 * Opcional: HTTP_OUTBOUND_ALLOWLIST_HOSTS=host1.com,*.api.example.com
 */

function parseAllowlist(): string[] {
  const raw = process.env.HTTP_OUTBOUND_ALLOWLIST_HOSTS?.trim()
  if (!raw) return []
  return raw
    .split(/[\s,]+/)
    .map((s) => s.toLowerCase().replace(/^\*\./, ''))
    .filter(Boolean)
}

function hostMatchesAllowlist(hostname: string, patterns: string[]): boolean {
  const h = hostname.toLowerCase()
  for (const p of patterns) {
    if (h === p || h.endsWith(`.${p}`)) return true
  }
  return false
}

/**
 * Bloqueia URLs perigosas. Se existir allowlist, o hostname tem de corresponder.
 */
export function isBlockedOutboundUrl(urlStr: string): boolean {
  let u: URL
  try {
    u = new URL(urlStr)
  } catch {
    return true
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') return true
  if (u.username || u.password) return true

  const host = u.hostname.toLowerCase()
  const allow = parseAllowlist()
  if (allow.length > 0) {
    return !hostMatchesAllowlist(host, allow)
  }

  if (host === 'localhost' || host.endsWith('.localhost')) return true
  if (host === '0.0.0.0' || host === '[::]' || host === '::') return true
  if (host === '127.0.0.1' || host === '[::1]' || host === '::1') return true

  if (host === 'metadata.google.internal' || host.endsWith('.internal'))
    return true
  if (host === 'metadata' || host === 'metadata.google') return true

  if (host.startsWith('10.')) return true
  if (host.startsWith('127.')) return true
  if (host.startsWith('192.168.')) return true
  if (host.startsWith('169.254.')) return true
  if (host.startsWith('100.')) {
    const rest = host.slice(4)
    const firstOctet = parseInt(rest.split('.')[0] || '0', 10)
    if (firstOctet >= 64 && firstOctet <= 127) return true
  }
  if (host.startsWith('172.')) {
    const parts = host.split('.')
    const second = parseInt(parts[1] || '0', 10)
    if (second >= 16 && second <= 31) return true
  }

  return false
}
