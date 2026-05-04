'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { User, UserType } from '@/types'
import { authApi } from '@/lib/api'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (u: User | null) => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  setUser: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Rehydrate from localStorage on mount (simple persistence until JWT added)
  useEffect(() => {
    const stored = localStorage.getItem('tc_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    // Backend now returns the full user on login
    const u = {
      user_id:    (res as any).user_id,
      first_name: (res as any).first_name,
      last_name:  (res as any).last_name,
      email:      (res as any).email,
      user_type:  (res as any).user_type,
      city:       (res as any).city,
      state:      (res as any).state,
      is_active:  true,
      created_at: '',
    } as User
    setUser(u)
    localStorage.setItem('tc_user', JSON.stringify(u))
    router.push(getDashboardRoute(u.user_type as UserType))
  }, [router])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
    localStorage.removeItem('tc_user')
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export function getDashboardRoute(userType: UserType): string {
  switch (userType) {
    case 'Employer':     return '/employer/dashboard'
    case 'Tradesperson': return '/tradesperson/dashboard'
    case 'Junior':       return '/junior/dashboard'
  }
}