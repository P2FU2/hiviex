/**
 * TypeScript types for SaaS platform
 */

import { TenantRole, AgentStatus, WorkflowStatus, SubscriptionStatus, PlanType, MessageRole } from '@prisma/client'

// ============================================
// TENANT & ORGANIZATION
// ============================================

export type { TenantRole, AgentStatus, WorkflowStatus, SubscriptionStatus, PlanType, MessageRole }

export interface TenantWithUsers {
  id: string
  name: string
  slug: string
  users: TenantUserWithUser[]
  createdAt: Date
  updatedAt: Date
}

export interface TenantUserWithUser {
  id: string
  role: TenantRole
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

// ============================================
// AGENTS
// ============================================

export interface AgentConfig {
  provider: 'openai' | 'anthropic' | 'cohere' | 'custom'
  model: string
  temperature: number
  maxTokens?: number
  systemPrompt?: string
  tools?: string[] // Tool names/IDs
}

export interface AgentWithTenant {
  id: string
  tenantId: string
  name: string
  description: string | null
  personality: string
  status: AgentStatus
  provider: string
  model: string
  temperature: number
  maxTokens: number | null
  avatarUrl: string | null
  videoUrl: string | null
  metadata: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
  tenant: {
    id: string
    name: string
    slug: string
  }
}

// ============================================
// CHAT & MESSAGES
// ============================================

export interface MessageWithAgent {
  id: string
  agentId: string
  role: MessageRole
  content: string
  metadata: Record<string, any> | null
  createdAt: Date
  agent: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
  metadata?: Record<string, any>
}

// ============================================
// WORKFLOWS
// ============================================

export interface WorkflowConfig {
  triggers: WorkflowTrigger[]
  actions: WorkflowAction[]
  conditions?: WorkflowCondition[]
}

export interface WorkflowTrigger {
  type: 'webhook' | 'schedule' | 'event' | 'manual'
  config: Record<string, any>
}

export interface WorkflowAction {
  type: 'agent' | 'api' | 'notification' | 'data'
  config: Record<string, any>
}

export interface WorkflowCondition {
  type: 'if' | 'switch' | 'loop'
  config: Record<string, any>
}

// ============================================
// BILLING
// ============================================

export interface PlanLimits {
  monthlyRequests: number
  agents: number
  workflows: number
  storageMB: number
  features: string[]
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    monthlyRequests: 100,
    agents: 1,
    workflows: 0,
    storageMB: 100,
    features: ['basic_chat', '1_agent'],
  },
  STARTER: {
    monthlyRequests: 1000,
    agents: 5,
    workflows: 3,
    storageMB: 1000,
    features: ['basic_chat', '5_agents', 'workflows', 'api_access'],
  },
  PROFESSIONAL: {
    monthlyRequests: 10000,
    agents: 20,
    workflows: 20,
    storageMB: 10000,
    features: ['advanced_chat', '20_agents', 'unlimited_workflows', 'api_access', 'priority_support'],
  },
  ENTERPRISE: {
    monthlyRequests: -1, // Unlimited
    agents: -1, // Unlimited
    workflows: -1, // Unlimited
    storageMB: -1, // Unlimited
    features: ['all_features', 'custom_integrations', 'dedicated_support', 'sla'],
  },
}

export interface UsageStats {
  requests: number
  tokens: number
  storageMB: number
  period: {
    start: Date
    end: Date
  }
}

// ============================================
// LLM PROVIDERS
// ============================================

export interface LLMProvider {
  name: string
  models: string[]
  generate: (params: LLMGenerateParams) => Promise<LLMResponse>
  generateStream?: (params: LLMGenerateParams) => AsyncGenerator<LLMChunk>
  embed?: (text: string | string[]) => Promise<number[][]>
}

export interface LLMGenerateParams {
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
  tools?: any[]
}

export interface LLMResponse {
  content: string
  tokens?: {
    prompt: number
    completion: number
    total: number
  }
  finishReason?: string
  metadata?: Record<string, any>
}

export interface LLMChunk {
  content: string
  done: boolean
  metadata?: Record<string, any>
}

// ============================================
// STORAGE
// ============================================

export interface StorageProvider {
  upload: (key: string, file: Buffer | Uint8Array, contentType: string) => Promise<string>
  delete: (key: string) => Promise<void>
  getUrl: (key: string) => string
}

