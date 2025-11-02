/**
 * Shared TypeScript type definitions
 */

export type Theme = 'light' | 'dark'

export interface MousePosition {
  x: number
  y: number
}

export interface Rotation3D {
  x: number
  y: number
}

export interface Coordinate3D {
  x: number
  y: number
  z: number
}

export interface AnimationConfig {
  duration?: number
  delay?: number
  ease?: string
}

