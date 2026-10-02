"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import type { PaseoUser } from "@/lib/paseo/types"
import { getPublicDB } from "@/lib/paseo/supabase"
import { toast } from "sonner"

interface AuthContextType {
  user: PaseoUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (data: { email: string; password: string; name: string; phone?: string; birthday?: string }) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function PaseoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PaseoUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshUser() {
    try {
      const res = await fetch("/api/paseo/auth")
      const data = await res.json()
      setUser(data.user)
    } catch (err) {
      console.error("Error al refrescar usuario:", err)
    }
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))

    // Escuchar eventos de autenticacion de Supabase (Google OAuth)
    const supabase = getPublicDB()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
        const email = session.user.email
        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          email?.split("@")[0]
        const avatar_url =
          session.user.user_metadata?.avatar_url ||
          session.user.user_metadata?.picture

        if (email) {
          try {
            const res = await fetch("/api/paseo/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "google", email, name, avatar_url }),
            })
            const data = await res.json()
            if (data.user) {
              setUser(data.user)
              if (data.isNew) {
                toast.success(`🎉 ¡Bienvenido al Club Paseo, ${data.user.name}!`, {
                  description: `Te regalamos 50 puntos de bienvenida. Correo enviado a ${email}`,
                  duration: 5000,
                })
              } else {
                toast.success(`¡Hola de nuevo, ${data.user.name}!`, {
                  description: "Sesión iniciada con Google",
                  duration: 4000,
                })
              }
            }
          } catch (e) {
            console.error("Error sincronizando usuario de Google:", e)
          }
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function login(email: string, password: string) {
    const res = await fetch("/api/paseo/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    })
    const data = await res.json()
    if (data.error) {
      toast.error("Error al iniciar sesión", { description: data.error })
      return { error: data.error }
    }
    setUser(data.user)
    toast.success(`¡Bienvenido de vuelta, ${data.user.name}!`, {
      description: "Sesión iniciada correctamente",
    })
    return {}
  }

  async function register(formData: { email: string; password: string; name: string; phone?: string; birthday?: string }) {
    const res = await fetch("/api/paseo/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", ...formData }),
    })
    const data = await res.json()
    if (data.error) {
      toast.error("Error al crear cuenta", { description: data.error })
      return { error: data.error }
    }
    setUser(data.user)
    toast.success("🎉 ¡Cuenta creada con éxito!", {
      description: `Bienvenido al Club Paseo. Te acreditamos 50 puntos y enviamos tu tarjeta a ${formData.email}`,
      duration: 5000,
    })
    return {}
  }

  async function signInWithGoogle() {
    try {
      const supabase = getPublicDB()
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "https://aranjuez.vercel.app/auth/callback"

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })
      if (error) {
        toast.error("Error al conectar con Google", { description: error.message })
        return { error: error.message }
      }
      return {}
    } catch (err: any) {
      toast.error("Error inesperado", { description: err.message })
      return { error: err.message || "Error al iniciar con Google" }
    }
  }

  async function logout() {
    try {
      const supabase = getPublicDB()
      await supabase.auth.signOut()
    } catch (e) {}

    await fetch("/api/paseo/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    })
    setUser(null)
    toast.info("Has cerrado sesión")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, signInWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function usePaseoAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("usePaseoAuth debe usarse dentro de PaseoAuthProvider")
  return ctx
}
