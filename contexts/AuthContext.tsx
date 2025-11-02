'use client'

/**
 * Authentication Context
 * 
 * Provides authentication state and methods for login/signup.
 * Prepared for future database integration.
 * 
 * @context
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  openAuthModal: (mode: 'login' | 'signup') => void
  closeAuthModal: () => void
  authModalOpen: boolean
  authModalMode: 'login' | 'signup'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    // Check if user is already logged in (from localStorage/token)
    // This will be replaced with actual token validation when DB is integrated
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Error parsing stored user:', e)
      }
    }
    setIsLoading(false)
  }, [])

  /**
   * Login function
   * Currently uses mock authentication. Will be replaced with API call.
   */
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true)
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // })
      // const data = await response.json()
      
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
      }
      
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
      setAuthModalOpen(false)
    } catch (error) {
      console.error('Login error:', error)
      throw new Error('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Signup function
   * Currently uses mock authentication. Will be replaced with API call.
   */
  const signup = async (email: string, password: string, name?: string): Promise<void> => {
    setIsLoading(true)
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password, name })
      // })
      // const data = await response.json()
      
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockUser: User = {
        id: '1',
        email,
        name: name || email.split('@')[0],
      }
      
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
      setAuthModalOpen(false)
    } catch (error) {
      console.error('Signup error:', error)
      throw new Error('Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Logout function
   */
  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    // TODO: Clear auth token when DB is integrated
    // localStorage.removeItem('authToken')
  }

  /**
   * Open authentication modal
   */
  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }

  /**
   * Close authentication modal
   */
  const closeAuthModal = () => {
    setAuthModalOpen(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

