export type CaptionSegment = { startMs: number; endMs: number; text: string }

function pad(n: number, w = 2): string {
  return String(n).padStart(w, '0')
}

function formatSrtTime(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const msPart = ms % 1000
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(msPart, 3)}`
}

export function segmentsToSrt(segments: CaptionSegment[]): string {
  if (!segments.length) {
    throw new Error('É necessário pelo menos um segmento de legenda.')
  }
  return segments
    .map((seg, i) => {
      const start = formatSrtTime(Math.max(0, seg.startMs))
      const end = formatSrtTime(Math.max(seg.startMs + 1, seg.endMs))
      const text = seg.text.replace(/\r/g, '').trim()
      return `${i + 1}\n${start} --> ${end}\n${text}\n`
    })
    .join('\n')
}

export function normalizeCaptionSegments(raw: unknown): CaptionSegment[] {
  let arr: unknown
  if (Array.isArray(raw)) {
    arr = raw
  } else if (
    raw &&
    typeof raw === 'object' &&
    Array.isArray((raw as { segments?: unknown }).segments)
  ) {
    arr = (raw as { segments: unknown[] }).segments
  } else {
    throw new Error('Formato de segments inválido.')
  }
  if (!Array.isArray(arr)) {
    throw new Error('Formato de segments inválido.')
  }
  const out: CaptionSegment[] = []
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const startMs = Number(o.startMs)
    const endMs = Number(o.endMs)
    const text = typeof o.text === 'string' ? o.text : ''
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || !text.trim()) continue
    out.push({ startMs, endMs, text })
  }
  if (!out.length) {
    throw new Error('Nenhum segmento de legenda válido.')
  }
  return out
}
