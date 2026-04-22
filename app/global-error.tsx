'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt">
      <body className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-semibold">Algo correu mal</h1>
        <p className="mt-2 text-sm text-zinc-400 text-center max-w-md">
          O erro foi registado. Pode tentar novamente ou voltar ao início.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium"
          >
            Tentar outra vez
          </button>
          <a
            href="/"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium"
          >
            Início
          </a>
        </div>
      </body>
    </html>
  )
}
