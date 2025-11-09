/**
 * Domain Types
 * 
 * Centralized type definitions for domain enums to avoid Prisma Client import issues
 */

export type FlowStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DRAFT'
export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type AgentStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT'
export type WorkflowStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
export type PlanType = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INCOMPLETE'
export type TenantRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type NodeType = 'AGENT' | 'PROCESS' | 'TRIGGER' | 'CONDITION' | 'INTEGRATION'
export type ProcessType = 'TASK' | 'RULE' | 'AUTOMATION' | 'TRIGGER' | 'INTEGRATION'

// Social Media Types
export type SocialPlatform = 'YOUTUBE' | 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'KWAII' | 'GMAIL'
export type SocialAccountStatus = 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'ERROR'
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED'
export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING'
