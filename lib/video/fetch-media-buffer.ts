/**
 * Download limitado para transcrição / processamento (com SSRF).
 */

import { isBlockedOutboundUrl } from '@/lib/security/ssrf'

const DEFAULT_MAX = 25 * 1024 * 1024

export async function fetchUrlBufferLimited(
  url: string,
  maxBytes: number = DEFAULT_MAX
): Promise<Buffer> {
  if (isBlockedOutboundUrl(url)) {
    throw new Error('URL bloqueada para download (SSRF).')
  }

  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) {
    throw new Error(`Download falhou: HTTP ${res.status}`)
  }

  const cl = res.headers.get('content-length')
  if (cl) {
    const n = parseInt(cl, 10)
    if (!Number.isNaN(n) && n > maxBytes) {
      throw new Error(`Conteúdo excede o limite de ${maxBytes} bytes`)
    }
  }

  const arr = await res.arrayBuffer()
  if (arr.byteLength > maxBytes) {
    throw new Error(`Conteúdo excede o limite de ${maxBytes} bytes`)
  }
  return Buffer.from(arr)
}
