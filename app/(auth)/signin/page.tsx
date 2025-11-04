/**
 * Sign In Intercept Page
 * 
 * Intercepts NextAuth default signin page and shows friendly message
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Home } from 'lucide-react'
import Link from 'next/link'

export default function SignInInterceptPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home after 3 seconds
    const timer = setTimeout(() => {
      router.push('/')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
            Use o Modal de Login
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Para fazer login, use o botão "Login" ou "Sign Up" no topo da página.
            <br />
            <br />
            Esta página não deve ser acessada diretamente.
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
            >
              <Home className="w-4 h-4" />
              Voltar para Home
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Redirecionando automaticamente em 3 segundos...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

