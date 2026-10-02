"use client"
import Link from "next/link"
import { usePaseoAuth } from "@/context/paseo/AuthContext"

export default function HomePage() {
  const { user } = usePaseoAuth()

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0b0a16 0%, #151230 45%, #0d0c1c 100%)",
      color: "#fff",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflowX: "hidden",
    }}>
      {/* Navbar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1.2rem 2.5rem",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(11,10,22,0.75)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <div style={{
            width: "42px", height: "42px",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.3rem", boxShadow: "0 4px 15px rgba(124, 58, 237, 0.4)"
          }}>🛍️</div>
          <div>
            <p style={{ fontWeight: 800, fontSize: "1.15rem", margin: 0, letterSpacing: "-0.3px" }}>Paseo Aranjuez</p>
            <p style={{ fontSize: "0.72rem", margin: 0, color: "#a78bfa", fontWeight: 600 }}>Ecosistema Digital Unificado</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                padding: "0.4rem 0.9rem", borderRadius: "20px",
                fontSize: "0.85rem", color: "#fbbf24", fontWeight: 700,
              }}>
                ⭐ {user.points ?? 0} Pts
              </div>
              <Link href="/cliente" style={{
                padding: "0.55rem 1.3rem", borderRadius: "10px",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#fff", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600,
              }}>Mi Portal</Link>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0.8rem" }}>
              <Link href="/auth/login" style={{
                padding: "0.55rem 1.2rem", borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.18)", color: "#fff",
                textDecoration: "none", fontSize: "0.9rem",
                transition: "all 0.2s",
              }}>Ingresar</Link>
              <Link href="/auth/registro" style={{
                padding: "0.55rem 1.3rem", borderRadius: "10px",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#fff", textDecoration: "none", fontSize: "0.9rem",
                fontWeight: 600, boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)"
              }}>Registrarse (+50 Pts)</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "5rem 1.5rem 3.5rem", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)",
          borderRadius: "100px", padding: "0.45rem 1.3rem", marginBottom: "1.8rem",
          fontSize: "0.85rem", color: "#c4b5fd", fontWeight: 600,
        }}>
          ⚡ Hackathon Paseo Aranjuez • Reto Experiencia y Fidelización
        </div>

        <h1 style={{
          fontSize: "clamp(2.5rem, 6.5vw, 4.5rem)",
          fontWeight: 900, margin: "0 0 1.2rem",
          background: "linear-gradient(135deg, #ffffff 10%, #c4b5fd 55%, #60a5fa 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          lineHeight: 1.1, letterSpacing: "-1px"
        }}>
          El Ecosistema Digital<br />de Paseo Aranjuez
        </h1>

        <p style={{
          fontSize: "1.2rem", color: "rgba(255,255,255,0.7)",
          maxWidth: "650px", margin: "0 auto 2.8rem", lineHeight: 1.6,
        }}>
          Paseo Aranjuez no necesita tres aplicaciones aisladas. Integra <strong>PaseoYa Marketplace</strong>, <strong>Paseo Points</strong> y <strong>Jarvis IA</strong> en una sola experiencia fluida en tiempo real (WebSockets).
        </p>

        <div style={{ display: "flex", gap: "1.2rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/cliente" style={{
            padding: "0.95rem 2.2rem", borderRadius: "14px",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "#fff", textDecoration: "none", fontSize: "1.05rem", fontWeight: 700,
            boxShadow: "0 0 30px rgba(124,58,237,0.45)",
          }}>🛍️ Explorar PaseoYa</Link>
          <Link href="/auth/registro" style={{
            padding: "0.95rem 2.2rem", borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", textDecoration: "none", fontSize: "1.05rem", fontWeight: 600,
            background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)",
          }}>🎁 Unirme al Club (+50 Pts)</Link>
        </div>
      </section>

      {/* Grid de 3 Pilares */}
      <section style={{ padding: "2rem 1.5rem 4rem", maxWidth: "1150px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.8rem" }}>
          
          {/* Pilar 1: PaseoYa */}
          <div style={{
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(124, 58, 237, 0.25)",
            borderRadius: "24px", padding: "2.2rem",
            backdropFilter: "blur(14px)", display: "flex", flexDirection: "column",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "16px",
              background: "rgba(124, 58, 237, 0.2)", border: "1px solid rgba(124, 58, 237, 0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem", marginBottom: "1.4rem",
            }}>🛍️</div>
            <h3 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 0.6rem" }}>PaseoYa</h3>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.6, fontSize: "0.95rem", flex: 1, marginBottom: "1.4rem" }}>
              Marketplace unificado con todas las tiendas del centro comercial (Tecnología, Moda, Salud, Gastronomía). Compra con QR y retira en tienda con PIN/código único.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.6rem" }}>
              <div style={{ color: "#a78bfa", fontSize: "0.85rem" }}>✓ Retiro Click & Collect sin colas</div>
              <div style={{ color: "#a78bfa", fontSize: "0.85rem" }}>✓ Estados en vivo por WebSockets</div>
              <div style={{ color: "#a78bfa", fontSize: "0.85rem" }}>✓ Notificación por correo Google SMTP</div>
            </div>
            <Link href="/cliente" style={{
              padding: "0.75rem 1.5rem", borderRadius: "10px",
              background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.4)",
              color: "#c4b5fd", textDecoration: "none", fontSize: "0.92rem", fontWeight: 700, textAlign: "center",
            }}>Ir al Marketplace →</Link>
          </div>

          {/* Pilar 2: Paseo Points */}
          <div style={{
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            borderRadius: "24px", padding: "2.2rem",
            backdropFilter: "blur(14px)", display: "flex", flexDirection: "column",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "16px",
              background: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem", marginBottom: "1.4rem",
            }}>⭐</div>
            <h3 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 0.6rem" }}>Paseo Points</h3>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.6, fontSize: "0.95rem", flex: 1, marginBottom: "1.4rem" }}>
              Sistema de lealtad cruzada. Cada Bs. 1 de compra en cualquier comercio suma 1 punto. Sube de categoría (Bronce, Plata, Oro, Platino) y canjea cupones con QR en segundos.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.6rem" }}>
              <div style={{ color: "#fcd34d", fontSize: "0.85rem" }}>✓ 50 Puntos de bienvenida gratis</div>
              <div style={{ color: "#fcd34d", fontSize: "0.85rem" }}>✓ Cupones digitales con QR de canje</div>
              <div style={{ color: "#fcd34d", fontSize: "0.85rem" }}>✓ Terminal para que comercios validen QR</div>
            </div>
            <Link href="/auth/registro" style={{
              padding: "0.75rem 1.5rem", borderRadius: "10px",
              background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.4)",
              color: "#fbbf24", textDecoration: "none", fontSize: "0.92rem", fontWeight: 700, textAlign: "center",
            }}>Ver Recompensas →</Link>
          </div>

          {/* Pilar 3: Jarvis IA */}
          <div style={{
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "24px", padding: "2.2rem",
            backdropFilter: "blur(14px)", display: "flex", flexDirection: "column",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "16px",
              background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem", marginBottom: "1.4rem",
            }}>🤖</div>
            <h3 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 0.6rem" }}>Jarvis Paseo</h3>
            <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.6, fontSize: "0.95rem", flex: 1, marginBottom: "1.4rem" }}>
              Asistente de Inteligencia Artificial entrenado con los locales, pisos, sectores, horarios y productos reales de Paseo Aranjuez. Recomienda tiendas y responde consultas al instante.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.6rem" }}>
              <div style={{ color: "#6ee7b7", fontSize: "0.85rem" }}>✓ Búsqueda por lenguaje natural</div>
              <div style={{ color: "#6ee7b7", fontSize: "0.85rem" }}>✓ Ubicación exacta de pisos y sectores</div>
              <div style={{ color: "#6ee7b7", fontSize: "0.85rem" }}>✓ Sugerencias de compras personalizadas</div>
            </div>
            <Link href="/cliente" style={{
              padding: "0.75rem 1.5rem", borderRadius: "10px",
              background: "rgba(16,185,129,0.18)", border: "1px solid rgba(16,185,129,0.4)",
              color: "#34d399", textDecoration: "none", fontSize: "0.92rem", fontWeight: 700, textAlign: "center",
            }}>Probar Asistente →</Link>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "3rem 1.5rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.4)", fontSize: "0.85rem",
      }}>
        <p style={{ fontWeight: 600, color: "#fff", margin: "0 0 6px 0" }}>Paseo Aranjuez • Av. América Este #1234, Cochabamba</p>
        <p style={{ margin: "0 0 12px 0" }}>Hackathon Paseo Aranjuez 2024 • Solución integral de Comercio, Fidelización e IA</p>
        <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", marginTop: "1rem" }}>
          <Link href="/auth/login" style={{ color: "#a78bfa", textDecoration: "none" }}>Portal Cliente</Link>
          <Link href="/auth/login" style={{ color: "#fbbf24", textDecoration: "none" }}>Portal Comercio</Link>
          <Link href="/auth/login" style={{ color: "#34d399", textDecoration: "none" }}>Panel Admin</Link>
        </div>
      </footer>
    </main>
  )
}