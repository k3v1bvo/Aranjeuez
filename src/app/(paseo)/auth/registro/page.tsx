"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePaseoAuth } from "@/context/paseo/AuthContext"
import Link from "next/link"

export default function RegistroPage() {
  const { register, signInWithGoogle } = usePaseoAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const result = await register(form)
    if (result.error) { setError(result.error); setLoading(false); return }
    router.push("/cliente")
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true); setError("")
    const result = await signInWithGoogle()
    if (result?.error) {
      setError(result.error)
      setGoogleLoading(false)
    }
  }

  return (
    <main style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0b0a16 0%,#17152f 50%,#0d0c1c 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"440px", padding:"1.5rem 1rem" }}>
        <div style={{ textAlign:"center", marginBottom:"1.8rem" }}>
          <div style={{
            width: "56px", height: "56px", margin: "0 auto 12px",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.8rem", boxShadow: "0 8px 24px rgba(245, 158, 11, 0.4)"
          }}>🎁</div>
          <h1 style={{ color:"#fff", fontSize:"1.8rem", fontWeight:800, margin:"0.2rem 0" }}>Únete al Club Paseo</h1>
          <p style={{ color:"#fbbf24", margin:0, fontSize:"0.9rem", fontWeight: 600 }}>¡Recibe 50 puntos de bienvenida gratis!</p>
        </div>

        <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"24px", padding:"2rem", backdropFilter:"blur(16px)" }}>
          {error && (
            <div style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:"10px", padding:"0.8rem 1rem", color:"#fca5a5", fontSize:"0.9rem", marginBottom:"1.2rem" }}>
              {error}
            </div>
          )}

          {/* Boton Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            style={{
              width: "100%",
              padding: "0.85rem",
              borderRadius: "12px",
              background: "#ffffff",
              border: "none",
              color: "#1f2937",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.7rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              transition: "transform 0.15s ease",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            {googleLoading ? "Conectando con Google..." : "Registrarse con Google"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", margin: "1.4rem 0" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.12)" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>o llena tus datos</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.12)" }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            <div>
              <label style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.85rem", display:"block", marginBottom:"0.4rem" }}>Nombre completo</label>
              <input type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Juan Pérez"
                style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"0.95rem", outline:"none", boxSizing:"border-box" }}
              />
            </div>
            <div>
              <label style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.85rem", display:"block", marginBottom:"0.4rem" }}>Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"0.95rem", outline:"none", boxSizing:"border-box" }}
              />
            </div>
            <div>
              <label style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.85rem", display:"block", marginBottom:"0.4rem" }}>Contraseña</label>
              <input type="password" required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"0.95rem", outline:"none", boxSizing:"border-box" }}
              />
            </div>
            <div>
              <label style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.85rem", display:"block", marginBottom:"0.4rem" }}>Celular / WhatsApp (opcional)</label>
              <input type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+591 70000000"
                style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"0.95rem", outline:"none", boxSizing:"border-box" }}
              />
            </div>
            <button type="submit" disabled={loading}
              style={{ padding:"0.85rem", borderRadius:"12px", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", border:"none", color:"#fff", fontSize:"1rem", fontWeight:700, cursor:"pointer", marginTop:"0.5rem", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creando cuenta..." : "Crear mi cuenta"}
            </button>
          </form>

          <div style={{ marginTop:"1.5rem", textAlign:"center" }}>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.85rem" }}>
              ¿Ya tienes cuenta?{" "}
              <Link href="/auth/login" style={{ color:"#a78bfa", textDecoration:"none", fontWeight: 600 }}>Inicia sesión</Link>
            </p>
          </div>
        </div>
        <p style={{ textAlign:"center", marginTop:"1.5rem" }}>
          <Link href="/" style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.85rem", textDecoration:"none" }}>← Volver al inicio</Link>
        </p>
      </div>
    </main>
  )
}