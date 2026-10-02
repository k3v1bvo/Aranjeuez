"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePaseoAuth } from "@/context/paseo/AuthContext"
import Link from "next/link"

export default function RegistroPage() {
  const { register } = usePaseoAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name:"", email:"", password:"", phone:"", birthday:"", role:"cliente" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return }
    setLoading(true); setError("")
    const result = await register(form)
    if (result.error) { setError(result.error); setLoading(false); return }
    router.push("/cliente")
  }

  const inputStyle = { width:"100%", padding:"0.75rem 1rem", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"1rem", outline:"none", boxSizing:"border-box" as const }

  return (
    <main style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0f0c29,#1a1a4e)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif", padding:"2rem 0" }}>
      <div style={{ width:"100%", maxWidth:"440px", padding:"0 1rem" }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <span style={{ fontSize:"2.5rem" }}>🏛️</span>
          <h1 style={{ color:"#fff", fontSize:"1.8rem", fontWeight:800, margin:"0.5rem 0 0.3rem" }}>Crear cuenta</h1>
          <p style={{ color:"rgba(255,255,255,0.5)", margin:0, fontSize:"0.9rem" }}>Únete al ecosistema Paseo Aranjuez</p>
        </div>
        <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"20px", padding:"2rem", backdropFilter:"blur(12px)" }}>
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {error && <div style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:"10px", padding:"0.8rem", color:"#fca5a5", fontSize:"0.9rem" }}>{error}</div>}
            
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.8rem" }}>
              <div>
                <label style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.8rem", display:"block", marginBottom:"0.3rem" }}>Nombre completo *</label>
                <input required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Tu nombre" style={inputStyle} />
              </div>
              <div>
                <label style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.8rem", display:"block", marginBottom:"0.3rem" }}>Teléfono</label>
                <input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="7XXXXXXX" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.8rem", display:"block", marginBottom:"0.3rem" }}>Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="tu@email.com" style={inputStyle} />
            </div>

            <div>
              <label style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.8rem", display:"block", marginBottom:"0.3rem" }}>Contraseña *</label>
              <input type="password" required value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Mínimo 6 caracteres" style={inputStyle} />
            </div>

            <div>
              <label style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.8rem", display:"block", marginBottom:"0.3rem" }}>Fecha de nacimiento <span style={{ color:"#a78bfa" }}>(¡puntos dobles en tu cumple!)</span></label>
              <input type="date" value={form.birthday} onChange={e => setForm(f=>({...f,birthday:e.target.value}))} style={inputStyle} />
            </div>

            <div>
              <label style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.8rem", display:"block", marginBottom:"0.5rem" }}>Tipo de cuenta</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem" }}>
                {[{val:"cliente",label:"👤 Cliente",desc:"Compra y gana puntos"},{val:"comercio",label:"🏪 Comercio",desc:"Gestiona tu tienda"}].map(opt => (
                  <button key={opt.val} type="button" onClick={() => setForm(f=>({...f,role:opt.val}))}
                    style={{ padding:"0.8rem", borderRadius:"10px", border:`1px solid ${form.role===opt.val?"#7c3aed":"rgba(255,255,255,0.15)"}`, background: form.role===opt.val?"rgba(124,58,237,0.2)":"rgba(255,255,255,0.05)", color:"#fff", cursor:"pointer", textAlign:"left" }}>
                    <div style={{ fontWeight:600, fontSize:"0.85rem" }}>{opt.label}</div>
                    <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.5)", marginTop:"0.2rem" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ padding:"0.9rem", borderRadius:"10px", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", border:"none", color:"#fff", fontSize:"1rem", fontWeight:700, cursor:"pointer", marginTop:"0.5rem", opacity: loading?0.7:1 }}>
              {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
            </button>
          </form>
          <p style={{ textAlign:"center", marginTop:"1.2rem", color:"rgba(255,255,255,0.4)", fontSize:"0.85rem" }}>
            ¿Ya tienes cuenta? <Link href="/auth/login" style={{ color:"#a78bfa", textDecoration:"none" }}>Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </main>
  )
}