/**
 * Cookie utility functions
 * Handles cookie storage and retrieval with proper expiration
 */

const COOKIE_CONSENT_KEY = 'cookie_consent'
const COOKIE_CONSENT_EXPIRY_DAYS = 365

/**
 * Sets a cookie with expiration
 */
export function setCookie(name: string, value: string, days: number = COOKIE_CONSENT_EXPIRY_DAYS): void {
  if (typeof window === 'undefined') return

  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

/**
 * Gets a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null

  const nameEQ = name + '='
  const cookies = document.cookie.split(';')
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length)
    }
  }
  
  return null
}

/**
 * Checks if user has consented to cookies
 */
export function hasCookieConsent(): boolean {
  return getCookie(COOKIE_CONSENT_KEY) === 'accepted'
}

/**
 * Sets cookie consent
 */
export function setCookieConsent(accepted: boolean): void {
  setCookie(COOKIE_CONSENT_KEY, accepted ? 'accepted' : 'rejected')
  
  // Also store in localStorage for easier access
  if (typeof window !== 'undefined') {
    localStorage.setItem(COOKIE_CONSENT_KEY, accepted ? 'accepted' : 'rejected')
  }
}

/**
 * Gets cookie consent status
 */
export function getCookieConsent(): 'accepted' | 'rejected' | null {
  if (typeof window === 'undefined') return null
  
  const cookieValue = getCookie(COOKIE_CONSENT_KEY)
  const storageValue = localStorage.getItem(COOKIE_CONSENT_KEY)
  
  if (cookieValue === 'accepted' || storageValue === 'accepted') {
    return 'accepted'
  }
  
  if (cookieValue === 'rejected' || storageValue === 'rejected') {
    return 'rejected'
  }
  
  return null
}

/**
 * Cookie types that we use
 */
export const COOKIE_TYPES = {
  ESSENTIAL: 'essential',
  ANALYTICS: 'analytics',
  FUNCTIONAL: 'functional',
  ADVERTISING: 'advertising',
} as const

export type CookieType = typeof COOKIE_TYPES[keyof typeof COOKIE_TYPES]

