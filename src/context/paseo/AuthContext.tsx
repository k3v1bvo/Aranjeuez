"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import type { PaseoUser } from "@/lib/paseo/types"

interface AuthContextType {
  user: PaseoUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (data: { email: string; password: string; name: string; phone?: string; birthday?: string }) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function PaseoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PaseoUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshUser() {
    const res = await fetch("/api/paseo/auth")
    const data = await res.json()
    setUser(data.user)
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await fetch("/api/paseo/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    })
    const data = await res.json()
    if (data.error) return { error: data.error }
    setUser(data.user)
    return {}
  }

  async function register(formData: { email: string; password: string; name: string; phone?: string; birthday?: string }) {
    const res = await fetch("/api/paseo/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", ...formData }),
    })
    const data = await res.json()
    if (data.error) return { error: data.error }
    setUser(data.user)
    return {}
  }

  async function logout() {
    await fetch("/api/paseo/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function usePaseoAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("usePaseoAuth debe usarse dentro de PaseoAuthProvider")
  return ctx
}
