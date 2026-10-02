"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePaseoAuth } from "@/context/paseo/AuthContext"
import Link from "next/link"

export default function LoginPage() {
  const { login } = usePaseoAuth()
  const router = useRouter()
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const result = await login(form.email, form.password)
    if (result.error) { setError(result.error); setLoading(false); return }
    router.push("/cliente")
  }

  return (
    <main style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f0c29,#1a1a4e)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"420px", padding:"0 1rem" }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <span style={{ fontSize:"2.5rem" }}>🏛️</span>
          <h1 style={{ color:"#fff", fontSize:"1.8rem", fontWeight:800, margin:"0.5rem 0 0.3rem" }}>Paseo Aranjuez</h1>
          <p style={{ color:"rgba(255,255,255,0.5)", margin:0, fontSize:"0.9rem" }}>Inicia sesión en tu cuenta</p>
        </div>
        <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"20px", padding:"2rem", backdropFilter:"blur(12px)" }}>
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {error && (
              <div style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:"10px", padding:"0.8rem 1rem", color:"#fca5a5", fontSize:"0.9rem" }}>
                {error}
              </div>
            )}
            <div>
              <label style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.85rem", display:"block", marginBottom:"0.4rem" }}>Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"1rem", outline:"none", boxSizing:"border-box" }}
              />
            </div>
            <div>
              <label style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.85rem", display:"block", marginBottom:"0.4rem" }}>Contraseña</label>
              <input type="password" required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                style={{ width:"100%", padding:"0.75rem 1rem", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"1rem", outline:"none", boxSizing:"border-box" }}
              />
            </div>
            <button type="submit" disabled={loading}
              style={{ padding:"0.9rem", borderRadius:"10px", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", border:"none", color:"#fff", fontSize:"1rem", fontWeight:700, cursor:"pointer", marginTop:"0.5rem", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
          <div style={{ marginTop:"1.5rem", textAlign:"center" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.85rem" }}>
              ¿No tienes cuenta?{" "}
              <Link href="/auth/registro" style={{ color:"#a78bfa", textDecoration:"none" }}>Regístrate</Link>
            </p>
            <div style={{ marginTop:"1rem", padding:"0.8rem", background:"rgba(255,255,255,0.04)", borderRadius:"8px", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)" }}>
              <strong style={{ color:"rgba(255,255,255,0.6)" }}>Demo admin:</strong> admin@paseoaranjuez.bo / password
            </div>
          </div>
        </div>
        <p style={{ textAlign:"center", marginTop:"1.5rem" }}>
          <Link href="/" style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.85rem", textDecoration:"none" }}>← Volver al inicio</Link>
        </p>
      </div>
    </main>
  )
}