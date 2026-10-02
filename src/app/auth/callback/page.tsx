"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getPublicDB } from "@/lib/paseo/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState("Procesando inicio de sesión con Google...")

  useEffect(() => {
    async function handleAuth() {
      try {
        const supabase = getPublicDB()
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          setStatus("Redirigiendo...")
          setTimeout(() => router.push("/cliente"), 1000)
          return
        }

        const email = session.user.email
        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          email?.split("@")[0]
        const avatar_url =
          session.user.user_metadata?.avatar_url ||
          session.user.user_metadata?.picture

        if (email) {
          setStatus("Sincronizando cuenta y puntos de bienvenida...")
          const res = await fetch("/api/paseo/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "google", email, name, avatar_url }),
          })
          const data = await res.json()
          if (data.isNew) {
            setStatus("¡Bienvenido al Club Paseo! +50 Puntos asignados. Redirigiendo...")
          } else {
            setStatus("¡Sesión iniciada con éxito! Redirigiendo...")
          }
        }

        setTimeout(() => {
          router.push("/cliente")
        }, 1200)
      } catch (e) {
        console.error("Error en callback:", e)
        router.push("/cliente")
      }
    }

    handleAuth()
  }, [router])

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0b0a16 0%, #17152f 50%, #0d0c1c 100%)",
      color: "#fff",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: "20px",
      textAlign: "center",
    }}>
      <div style={{
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        border: "3px solid rgba(139, 92, 246, 0.3)",
        borderTopColor: "#a78bfa",
        animation: "spin 1s linear infinite",
        marginBottom: "24px",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 8px 0" }}>Paseo Aranjuez</h2>
      <p style={{ color: "#a78bfa", fontSize: "0.95rem" }}>{status}</p>
    </div>
  )
}