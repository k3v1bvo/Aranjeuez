"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePaseoAuth } from "@/context/paseo/AuthContext"
import { QRCodeDisplay } from "@/components/QRCodeDisplay"

export default function PerfilPage() {
  const { user, logout } = usePaseoAuth()
  const router = useRouter()

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0a16", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Link href="/auth/login" style={{ color: "#a78bfa" }}>Iniciar sesión para ver tu perfil</Link>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0b0a16 0%, #151230 50%, #0d0c1c 100%)",
      color: "#f3f4f6",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      paddingBottom: "4rem",
    }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)", background: "rgba(11,10,22,0.85)", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/cliente" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.9rem" }}>
            ← Volver a PaseoYa
          </Link>
          <h1 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Mi Perfil Paseo</h1>
        </div>

        <button
          onClick={() => logout().then(() => router.push("/"))}
          style={{
            padding: "0.45rem 1rem", borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5", fontSize: "0.85rem", cursor: "pointer", fontWeight: 600,
          }}
        >
          Cerrar Sesión
        </button>
      </header>

      <main style={{ maxWidth: "650px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        
        {/* QR Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)",
          border: "1px solid rgba(245, 158, 11, 0.35)", borderRadius: "24px",
          padding: "2.5rem 2rem", textAlign: "center", marginBottom: "2rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        }}>
          <div style={{
            display: "inline-block", background: "rgba(245, 158, 11, 0.2)",
            color: "#fbbf24", padding: "4px 14px", borderRadius: "99px",
            fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
            marginBottom: "1rem",
          }}>
            Nivel {user.level?.toUpperCase()}
          </div>

          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 0.3rem 0" }}>{user.name}</h2>
          <p style={{ color: "#a78bfa", fontSize: "0.9rem", margin: "0 0 1.5rem 0" }}>{user.email}</p>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <QRCodeDisplay value={user.qr_token || "cliente-paseo-001"} size={190} label="Tu QR de Membresía Oficial" />
          </div>

          <div style={{
            background: "rgba(0,0,0,0.3)", padding: "14px", borderRadius: "14px",
            display: "flex", justifyContent: "space-around",
          }}>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fbbf24" }}>{user.points}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Paseo Points</div>
            </div>
            <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#34d399" }}>Bs. 1 = 1 Pt</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Ratio de Canje</div>
            </div>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Link href="/cliente/pedidos" style={{
            padding: "1.2rem", borderRadius: "16px", textDecoration: "none",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", display: "flex", flexDirection: "column", gap: "6px"
          }}>
            <span style={{ fontSize: "1.5rem" }}>🛍️</span>
            <strong style={{ fontSize: "1rem" }}>Mis Pedidos en Vivo</strong>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Seguimiento por WebSockets</span>
          </Link>

          <Link href="/cliente/puntos" style={{
            padding: "1.2rem", borderRadius: "16px", textDecoration: "none",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", display: "flex", flexDirection: "column", gap: "6px"
          }}>
            <span style={{ fontSize: "1.5rem" }}>⭐</span>
            <strong style={{ fontSize: "1rem" }}>Club de Puntos</strong>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Canjear cupones con QR</span>
          </Link>
        </div>

      </main>
    </div>
  )
}