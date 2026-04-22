/**
 * Chat direto com um agente — histórico + erros alinhados ao hub APIs & IA.
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react'

type Role = 'user' | 'assistant'

function mapApiRole(role: string): Role {
  return role === 'USER' ? 'user' : 'assistant'
}

export default function AgentChatPage() {
  const params = useParams()
  const agentId = params.id as string
  const [messages, setMessages] = useState<
    { id: string; role: Role; content: string; timestamp: Date; isError?: boolean }[]
  >([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/agents/${agentId}/messages?limit=100`)
      if (!res.ok) return
      const data = await res.json()
      const list = Array.isArray(data.messages) ? data.messages : []
      setMessages(
        list.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
          id: m.id,
          role: mapApiRole(m.role),
          content: m.content,
          timestamp: new Date(m.createdAt),
        }))
      )
    } finally {
      setLoadingHistory(false)
    }
  }, [agentId])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMessage = {
      id: `local-${Date.now()}`,
      role: 'user' as const,
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errMsg = typeof data.error === 'string' ? data.error : `Erro ${response.status}`
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant' as const,
            content: `${errMsg}\n\nConfigure chaves em APIs e IA (workspace).`,
            timestamp: new Date(),
            isError: true,
          },
        ])
        return
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant' as const,
          content: typeof data.response === 'string' ? data.response : '',
          timestamp: new Date(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant' as const,
          content: 'Erro de rede. Tente novamente.',
          timestamp: new Date(),
          isError: true,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[min(85vh,calc(100vh-12rem))] flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/80">
      <div className="flex flex-1 flex-col gap-2 border-b border-[var(--border-subtle)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          Chaves LLM por workspace:{' '}
          <Link href="/dashboard/apis" className="font-medium text-[var(--accent)] hover:underline">
            APIs e IA
          </Link>
        </p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto bg-[var(--surface-base)]/40 p-4">
        {loadingHistory ? (
          <div className="flex justify-center gap-2 py-12 text-sm text-[var(--text-secondary)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
            A carregar…
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center">
            <Bot className="mx-auto mb-4 h-14 w-14 text-[var(--text-tertiary)]" strokeWidth={1} />
            <p className="text-sm text-[var(--text-secondary)]">Comece uma conversa com o agente.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    message.isError ? 'bg-[var(--danger-muted)]' : 'bg-[var(--accent-muted)]'
                  }`}
                >
                  {message.isError ? (
                    <AlertCircle className="h-4 w-4 text-[var(--danger)]" />
                  ) : (
                    <Bot className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} />
                  )}
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : message.isError
                      ? 'border border-[var(--danger)]/25 bg-[var(--danger-muted)] text-[var(--text-primary)]'
                      : 'border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)]'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                {message.isError ? (
                  <Link
                    href="/dashboard/apis"
                    className="mt-2 inline-block text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    Hub APIs e IA →
                  </Link>
                ) : null}
                <p className="mt-1 text-[11px] opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-elevated)] ring-1 ring-[var(--border-subtle)]">
                  <User className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading ? (
          <div className="flex justify-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-muted)]">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[var(--border-subtle)] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder="Mensagem…"
            className="flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-base)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)]"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-[var(--accent-foreground)] transition-premium hover:opacity-92 disabled:opacity-40"
            aria-label="Enviar"
          >
            <Send className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  )
}
