/**
 * Providers Index
 * 
 * Exporta todos os provedores de redes sociais
 */

import { YouTubeProvider } from './youtube-provider'
import { InstagramProvider } from './instagram-provider'
import type { BaseSocialProvider } from '../base-provider'
import type { SocialPlatform } from '@/lib/types/domain'

export { YouTubeProvider, InstagramProvider }
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
      // TODO: Implementar FacebookProvider
      throw new Error('Facebook provider not yet implemented')
    case 'TIKTOK':
      // TODO: Implementar TikTokProvider
      throw new Error('TikTok provider not yet implemented')
    case 'KWAII':
      // TODO: Implementar KwaiiProvider
      throw new Error('Kwaii provider not yet implemented')
    case 'GMAIL':
      // TODO: Implementar GmailProvider
      throw new Error('Gmail provider not yet implemented')
    default:
      throw new Error(`Unknown platform: ${platform}`)
  }
}

