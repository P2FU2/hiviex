'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const Cursor = dynamic(() => import('@/components/Cursor'), { ssr: false })

/** Cursor personalizado apenas na landing — dashboard e resto da app usam cursor nativo. */
export default function ConditionalCursor() {
  const pathname = usePathname()
  if (pathname !== '/') return null
  return <Cursor />
}
