'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

type CommandPaletteContextValue = {
  open: boolean
  setOpen: (v: boolean) => void
  toggle: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null
)

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen((o) => !o), [])

  const value = useMemo(
    () => ({ open, setOpen, toggle }),
    [open, toggle]
  )

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  }
  return ctx
}
