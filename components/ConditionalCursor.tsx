'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const Cursor = dynamic(() => import('@/components/Cursor'), { ssr: false })

/** Rotas marketing com cursor custom; resto da app usa cursor nativo. */
const MARKETING_CURSOR_PATHS = new Set([
  '/',
  '/features',
  '/changelog',
  '/status',
])

export default function ConditionalCursor() {
  const pathname = usePathname()
  if (!MARKETING_CURSOR_PATHS.has(pathname)) return null
  return <Cursor />
}
