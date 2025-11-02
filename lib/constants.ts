/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values
 */

// Theme constants
export const THEME_STORAGE_KEY = 'theme'
export const DEFAULT_THEME = 'dark' as const

// Animation constants
export const ANIMATION_DURATION = {
  SHORT: 0.3,
  MEDIUM: 0.6,
  LONG: 1.0,
} as const

export const TRANSITION = {
  SPRING: { type: 'spring' as const, stiffness: 300 },
  EASE: 'ease-out' as const,
} as const

// 3D Scene constants
export const SCENE_3D = {
  CAMERA: {
    POSITION: [0, 0, 5] as [number, number, number],
    FOV: 75,
  },
  PARTICLES: {
    COUNT: 50,
    SIZE: 0.02,
  },
  SPHERE: {
    RADIUS: 1,
    SEGMENTS: 64,
  },
  STARS: {
    RADIUS: 300,
    DEPTH: 50,
    COUNT: 5000,
    FACTOR: 4,
  },
} as const

// Cursor constants
export const CURSOR = {
  Z_INDEX: 99999,
  SIZE: 24,
  INTERACTIVE_SELECTORS: 'a,button,[role="button"],input,textarea,select,summary,label',
  SMOOTHNESS: 0.2,
  SCALE_ON_HOVER: 1.15,
} as const

// Header constants
export const HEADER = {
  SCROLL_THRESHOLD: 300,
  ANIMATION_DURATION: 0.3,
} as const

// Mouse tracking constants
export const MOUSE_TRACKING = {
  ROTATION_INTENSITY: 15,
  POSITION_MULTIPLIER: 20,
} as const

// Particle animation constants
export const PARTICLES = {
  COUNT: 20,
  ANIMATION: {
    MIN_DURATION: 2,
    MAX_DURATION: 5,
    MAX_DELAY: 2,
  },
} as const

