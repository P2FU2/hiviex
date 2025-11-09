/**
 * Chat Page - Estilo WhatsApp
 * 
 * Interface de chat com lista de conversas à esquerda e chat à direita
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, ArrowLeft, Search, MoreVertical } from 'lucide-react'
import Image from 'next/image'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentId?: string
  agentName?: string
  timestamp: Date
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

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [agents, setAgents] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadAgents()
    loadConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    }
  }

  const loadConversations = async () => {
    if (agents.length === 0) return
    
    // Load conversations from agents
    const convs: Conversation[] = agents.map((agent) => ({
      id: agent.id,
      agentId: agent.id,
      agentName: agent.name,
      agentAvatar: agent.avatarUrl,
      lastMessage: 'Comece uma conversa...',
      lastMessageTime: new Date(),
      unreadCount: 0,
    }))
    setConversations(convs)
    if (convs.length > 0 && !selectedConversation) {
      setSelectedConversation(convs[0].id)
    }
  }

  useEffect(() => {
    if (agents.length > 0) {
      loadConversations()
    }
  }, [agents])

  const loadMessages = async (agentId: string) => {
    // In production, load from API
    setMessages([])
  }

  const handleSend = async () => {
    if (!input.trim() || !selectedConversation || isLoading) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Update conversation last message
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation
          ? {
              ...conv,
              lastMessage: input.trim(),
              lastMessageTime: new Date(),
            }
          : conv
      )
    )

    try {
      const response = await fetch(`/api/agents/${selectedConversation}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      const selectedAgent = agents.find((a) => a.id === selectedConversation)

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.response,
        agentId: selectedConversation,
        agentName: selectedAgent?.name,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const selectedConv = conversations.find((c) => c.id === selectedConversation)
  const filteredConversations = conversations.filter((conv) =>
    conv.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-black">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black dark:text-white">Chats</h2>
            <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg">
              <MoreVertical className="w-5 h-5 text-black dark:text-white" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversas..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-black dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                selectedConversation === conv.id
                  ? 'bg-black/5 dark:bg-white/5 border-l-2 border-black dark:border-white'
                  : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                {conv.agentAvatar ? (
                  <Image
                    src={conv.agentAvatar}
                    alt={conv.agentName}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-black dark:text-white truncate">
                    {conv.agentName}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                    {new Date(conv.lastMessageTime).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                  {conv.unreadCount}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-black dark:text-white" />
              </button>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                {selectedConv.agentAvatar ? (
                  <Image
                    src={selectedConv.agentAvatar}
                    alt={selectedConv.agentName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-black dark:text-white">
                  {selectedConv.agentName}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Online</p>
              </div>
              <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg">
                <MoreVertical className="w-5 h-5 text-black dark:text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                      Comece uma conversa
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Envie uma mensagem para {selectedConv.agentName}
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-black border border-gray-200 dark:border-white/10 text-black dark:text-white'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          message.role === 'user'
                            ? 'text-blue-100'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-black">
              <div className="flex items-center gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Escolha uma conversa da lista para começar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
