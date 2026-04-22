/**
 * Providers Index
 * 
 * Exporta todos os provedores de redes sociais
 */

import { YouTubeProvider } from './youtube-provider'
import { InstagramProvider } from './instagram-provider'
import { FacebookProvider } from './facebook-provider'
import { PlannedSocialProvider } from './planned-social-provider'
import type { BaseSocialProvider } from '../base-provider'
import type { SocialPlatform } from '@/lib/types/domain'

export { YouTubeProvider, InstagramProvider, FacebookProvider, PlannedSocialProvider }
export type { BaseSocialProvider }

/**
 * Factory para criar instâncias de providers
 */
export function createProvider(platform: SocialPlatform): BaseSocialProvider {
  switch (platform) {
    case 'YOUTUBE':
      return new YouTubeProvider()
    case 'INSTAGRAM':
      return new InstagramProvider()
    case 'FACEBOOK':
      return new FacebookProvider()
    case 'TIKTOK':
      return new PlannedSocialProvider('TIKTOK', 'TikTok')
    case 'KWAII':
      return new PlannedSocialProvider('KWAII', 'Kwai')
    case 'GMAIL':
      return new PlannedSocialProvider('GMAIL', 'Gmail')
    default:
      throw new Error(`Unknown platform: ${platform}`)
  }
}

