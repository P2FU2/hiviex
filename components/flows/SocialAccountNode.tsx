/**
 * Social Account Node Component
 * 
 * Nó para representar contas de redes sociais
 */

'use client'

import { Handle, Position } from 'reactflow'
import { Instagram, Twitter, Youtube, Facebook, Linkedin, Globe } from 'lucide-react'

interface SocialAccountNodeData {
  label: string
  platform: string
  accountName?: string
  config?: any
}

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  linkedin: Linkedin,
  default: Globe,
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  twitter: 'bg-blue-400',
  youtube: 'bg-red-500',
  facebook: 'bg-blue-600',
  linkedin: 'bg-blue-700',
  default: 'bg-gray-500',
}

export default function SocialAccountNode({ data }: { data: SocialAccountNodeData }) {
  const Icon = PLATFORM_ICONS[data.platform.toLowerCase()] || PLATFORM_ICONS.default
  const colorClass = PLATFORM_COLORS[data.platform.toLowerCase()] || PLATFORM_COLORS.default

  return (
    <div className="px-4 py-3 bg-white dark:bg-black border-2 border-gray-300 dark:border-gray-700 rounded-lg shadow-lg min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-black dark:text-white capitalize">
            {data.platform}
          </div>
          {data.accountName && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              @{data.accountName}
            </div>
          )}
        </div>
      </div>
      
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {data.label}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}

