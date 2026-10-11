import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    authService
      .getCurrentUser()
      .then((u) => {
        if (active) setUser(u)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const unsub = authService.subscribe((state) => {
      setUser(state.currentUser ?? null)
    })

    return () => {
      active = false
      unsub()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(email, password) {
        const u = await authService.login(email, password)
        setUser(u)
        return u
      },
      async logout() {
        await authService.logout()
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
