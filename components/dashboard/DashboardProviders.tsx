'use client'

import { useEffect } from 'react'
import {
  CommandPaletteProvider,
  useCommandPalette,
} from '@/contexts/CommandPaletteContext'
import CommandPalette from '@/components/dashboard/CommandPalette'

function CommandPaletteHost({ children }: { children: React.ReactNode }) {
  const { setOpen } = useCommandPalette()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  return (
    <>
      {children}
      <CommandPalette />
    </>
  )
}

export default function DashboardProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CommandPaletteProvider>
      <CommandPaletteHost>{children}</CommandPaletteHost>
    </CommandPaletteProvider>
  )
}
