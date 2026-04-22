/**
 * Chat — lista de agentes + conversa, histórico da BD, erros explícitos e ligação ao hub APIs & IA.
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Send, Bot, User, ArrowLeft, Search, AlertCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentId?: string
  agentName?: string
  timestamp: Date
  isError?: boolean
}

interface Conversation {
  id: string
  agentId: string
  agentName: string
  agentAvatar?: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
}

function mapApiRole(role: string): 'user' | 'assistant' {
  if (role === 'USER') return 'user'
  return 'assistant'
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [agents, setAgents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch('/api/agents')
        if (!response.ok || cancelled) return
        const data = await response.json()
        const list = data.agents || []
        if (cancelled) return
        setAgents(list)
        const convs: Conversation[] = list.map((agent: any) => ({
          id: agent.id,
          agentId: agent.id,
          agentName: agent.name,
          agentAvatar: agent.avatarUrl,
          lastMessage: 'Comece uma conversa…',
          lastMessageTime: new Date(),
          unreadCount: 0,
        }))
        setConversations(convs)
        if (convs.length > 0) {
          setSelectedConversation((prev) => prev ?? convs[0].id)
        }
      } catch (error) {
        console.error('Error loading agents:', error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadMessages = useCallback(async (agentId: string) => {
    setIsLoadingHistory(true)
    setMessages([])
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
    } catch {
      setMessages([])
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    if (selectedConversation) void loadMessages(selectedConversation)
  }, [selectedConversation, loadMessages])

  const handleSend = async () => {
    if (!input.trim() || !selectedConversation || isLoading) return

    const text = input.trim()
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation
          ? {
              ...conv,
              lastMessage: text,
              lastMessageTime: new Date(),
            }
          : conv
      )
    )

    try {
      const response = await fetch(`/api/agents/${selectedConversation}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      const data = await response.json().catch(() => ({}))
      const selectedAgent = agents.find((a) => a.id === selectedConversation)

      if (!response.ok) {
        const errMsg =
          typeof data.error === 'string'
            ? data.error
            : `Pedido falhou (${response.status}).`
        const extra =
          data.code === 'USAGE_LIMIT_EXCEEDED'
            ? '\n\nLimite do plano ou quota mensal atingida.'
            : ''
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `${errMsg}${extra}\n\nSe faltar chave de API, configure em «APIs e IA» ou nas definições do workspace (owner/admin).`,
            agentId: selectedConversation,
            agentName: selectedAgent?.name,
            timestamp: new Date(),
            isError: true,
          },
        ])
        return
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: typeof data.response === 'string' ? data.response : '',
        agentId: selectedConversation,
        agentName: selectedAgent?.name,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            'Erro de rede ou timeout. Tente novamente.\n\nSe persistir, verifique o estado do serviço e as chaves em APIs e IA.',
          timestamp: new Date(),
          isError: true,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const selectedConv = conversations.find((c) => c.id === selectedConversation)
  const filteredConversations = conversations.filter((conv) =>
    conv.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/60 md:flex-row md:h-[calc(100vh-7rem)]">
      {/* Lista */}
      <div className="flex w-full flex-col border-b border-[var(--border-subtle)] md:w-[min(100%,320px)] md:border-b-0 md:border-r">
        <div className="border-b border-[var(--border-subtle)] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              Chats
            </h2>
            <Link
              href="/dashboard/apis"
              className="text-xs font-medium text-[var(--accent)] underline-offset-2 hover:underline"
            >
              APIs &amp; IA
            </Link>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar agentes…"
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)] py-2 pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)]"
            />
          </div>
        </div>

        <div className="max-h-[40vh] flex-1 overflow-y-auto md:max-h-none">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
              Nenhum agente.{' '}
              <Link href="/dashboard/agents/new" className="font-medium text-[var(--accent)] hover:underline">
                Criar agente
              </Link>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setSelectedConversation(conv.id)}
                className={`flex w-full items-center gap-3 p-4 text-left transition-premium hover:bg-[var(--accent-muted)] ${
                  selectedConversation === conv.id
                    ? 'border-l-2 border-[var(--accent)] bg-[var(--accent-muted)]'
                    : 'border-l-2 border-transparent'
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)]">
                  {conv.agentAvatar ? (
                    <Image
                      src={conv.agentAvatar}
                      alt={conv.agentName}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <Bot className="h-6 w-6 text-[var(--accent)]" strokeWidth={1.5} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <h3 className="truncate font-medium text-[var(--text-primary)]">{conv.agentName}</h3>
                    <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
                      {new Date(conv.lastMessageTime).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="truncate text-sm text-[var(--text-secondary)]">{conv.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex min-h-[50vh] flex-1 flex-col md:min-h-0">
        {selectedConversation && selectedConv ? (
          <>
            <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] p-4">
              <button
                type="button"
                onClick={() => setSelectedConversation(null)}
                className="rounded-lg p-2 text-[var(--text-secondary)] transition-premium hover:bg-[var(--surface-base)] md:hidden"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-muted)]">
                {selectedConv.agentAvatar ? (
                  <Image
                    src={selectedConv.agentAvatar}
                    alt={selectedConv.agentName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <Bot className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.5} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[var(--text-primary)]">{selectedConv.agentName}</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Assistente · respostas via LLM configurado</p>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[var(--surface-base)]/50 p-4">
              {isLoadingHistory ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
                  A carregar histórico…
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <Bot className="mb-4 h-14 w-14 text-[var(--text-tertiary)]" strokeWidth={1} />
                  <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
                    Nova conversa
                  </h3>
                  <p className="max-w-sm text-sm text-[var(--text-secondary)]">
                    Mensagens são guardadas no workspace. Garanta uma chave de API do mesmo{' '}
                    <em>provider</em> do agente em{' '}
                    <Link href="/dashboard/apis" className="font-medium text-[var(--accent)] hover:underline">
                      APIs e IA
                    </Link>
                    .
                  </p>
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
                          <AlertCircle className="h-4 w-4 text-[var(--danger)]" strokeWidth={1.75} />
                        ) : (
                          <Bot className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.75} />
                        )}
                      </div>
                    )}
                    <div
                      className={`max-w-[min(100%,560px)] rounded-xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                          : message.isError
                            ? 'border border-[var(--danger)]/30 bg-[var(--danger-muted)] text-[var(--text-primary)]'
                            : 'border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                      {message.isError ? (
                        <Link
                          href="/dashboard/apis"
                          className="mt-2 inline-block text-xs font-medium text-[var(--accent)] hover:underline"
                        >
                          Abrir hub APIs e IA →
                        </Link>
                      ) : null}
                      <div
                        className={`mt-1 text-[11px] ${
                          message.role === 'user' ? 'opacity-80' : 'text-[var(--text-tertiary)]'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-elevated)] ring-1 ring-[var(--border-subtle)]">
                        <User className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva a mensagem… (Enter envia, Shift+Enter nova linha)"
                  rows={2}
                  className="min-h-[48px] flex-1 resize-none rounded-xl border border-[var(--border-strong)] bg-[var(--surface-base)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-muted)]"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] transition-premium hover:opacity-92 disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Enviar"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} />
                  ) : (
                    <Send className="h-5 w-5" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <Bot className="mx-auto mb-4 h-14 w-14 text-[var(--text-tertiary)]" strokeWidth={1} />
              <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
                Selecione um agente
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Escolha um agente à esquerda para ver o histórico e conversar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
