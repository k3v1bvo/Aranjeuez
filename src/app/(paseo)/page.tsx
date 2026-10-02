import Link from "next/link"

export default function PaseoLandingPage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #1a1a4e 40%, #24243e 100%)",
      color: "#fff",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflowX: "hidden",
    }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1.2rem 2rem",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(15,12,41,0.7)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.8rem" }}>🏛️</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>Paseo Aranjuez</p>
            <p style={{ fontSize: "0.7rem", margin: 0, color: "#a78bfa" }}>Ecosistema Digital</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link href="/auth/login" style={{
            padding: "0.5rem 1.2rem", borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)", color: "#fff",
            textDecoration: "none", fontSize: "0.9rem",
            transition: "all 0.2s",
          }}>Iniciar sesión</Link>
          <Link href="/auth/registro" style={{
            padding: "0.5rem 1.2rem", borderRadius: "8px",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "#fff", textDecoration: "none", fontSize: "0.9rem",
            fontWeight: 600,
          }}>Registrarse</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "5rem 2rem 3rem" }}>
        <div style={{
          display: "inline-block",
          background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.4)",
          borderRadius: "100px", padding: "0.4rem 1.2rem", marginBottom: "1.5rem",
          fontSize: "0.85rem", color: "#a78bfa",
        }}>
          🏆 Hackathon Paseo Aranjuez 2024
        </div>
        <h1 style={{
          fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
          fontWeight: 800, margin: "0 0 1rem",
          background: "linear-gradient(135deg, #fff 0%, #a78bfa 50%, #60a5fa 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          lineHeight: 1.1,
        }}>
          El Ecosistema Digital<br />de Paseo Aranjuez
        </h1>
        <p style={{
          fontSize: "1.2rem", color: "rgba(255,255,255,0.65)",
          maxWidth: "600px", margin: "0 auto 2.5rem", lineHeight: 1.6,
        }}>
          Compra, acumula puntos y accede a un asistente inteligente.<br />
          Todo en una sola plataforma.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/cliente" style={{
            padding: "0.9rem 2rem", borderRadius: "12px",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "#fff", textDecoration: "none", fontSize: "1rem", fontWeight: 600,
            boxShadow: "0 0 30px rgba(124,58,237,0.4)",
          }}>🛍️ Explorar PaseoYa</Link>
          <Link href="/jarvis" style={{
            padding: "0.9rem 2rem", borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", textDecoration: "none", fontSize: "1rem",
            backdropFilter: "blur(8px)",
          }}>🤖 Hablar con Jarvis</Link>
        </div>
      </section>

      {/* Tres módulos */}
      <section style={{ padding: "3rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {[
            {
              icon: "🛍️", title: "PaseoYa", color: "#4f46e5",
              desc: "Marketplace completo de Paseo Aranjuez. Explora tiendas, compara productos y haz tu pedido. Retira en el Paseo.",
              link: "/cliente", linkText: "Ir a PaseoYa",
              features: ["Catálogo de todas las tiendas", "Carrito y checkout", "QR + PIN de retiro", "Tracking en tiempo real"],
            },
            {
              icon: "⭐", title: "Paseo Points", color: "#f59e0b",
              desc: "Cada compra suma puntos. Sube de nivel, canjea recompensas y accede a beneficios exclusivos del Paseo.",
              link: "/cliente/puntos", linkText: "Ver mis puntos",
              features: ["Bs 1 = 1 punto automático", "Niveles Bronce → Platino", "Catálogo de recompensas", "Cupones digitales con QR"],
            },
            {
              icon: "🤖", title: "Jarvis Paseo", color: "#10b981",
              desc: "Tu asistente inteligente. Pregunta por tiendas, productos, horarios y recibe recomendaciones personalizadas.",
              link: "/jarvis", linkText: "Hablar con Jarvis",
              features: ["IA con datos reales del Paseo", "Recomendaciones inteligentes", "Ubicación de locales", "Consulta tu pedido"],
            },
          ].map((mod) => (
            <div key={mod.title} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px", padding: "2rem",
              backdropFilter: "blur(12px)",
              transition: "transform 0.2s",
            }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "14px",
                background: `${mod.color}22`, border: `1px solid ${mod.color}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.8rem", marginBottom: "1.2rem",
              }}>{mod.icon}</div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.6rem" }}>{mod.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: "1.2rem", fontSize: "0.95rem" }}>{mod.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem" }}>
                {mod.features.map(f => (
                  <li key={f} style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                    ✓ {f}
                  </li>
                ))}
              </ul>
              <Link href={mod.link} style={{
                display: "inline-block", padding: "0.6rem 1.4rem",
                borderRadius: "8px", border: `1px solid ${mod.color}66`,
                color: mod.color, textDecoration: "none", fontSize: "0.9rem", fontWeight: 600,
              }}>{mod.linkText} →</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Portales */}
      <section style={{
        padding: "3rem 2rem", textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", marginBottom: "1rem" }}>Acceso por tipo de usuario</p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/cliente" style={{ padding: "0.6rem 1.4rem", borderRadius: "8px", background: "rgba(79,70,229,0.15)", border: "1px solid rgba(79,70,229,0.3)", color: "#818cf8", textDecoration: "none", fontSize: "0.9rem" }}>👤 Portal Cliente</Link>
          <Link href="/comercio" style={{ padding: "0.6rem 1.4rem", borderRadius: "8px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24", textDecoration: "none", fontSize: "0.9rem" }}>🏪 Portal Comercio</Link>
          <Link href="/admin" style={{ padding: "0.6rem 1.4rem", borderRadius: "8px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", textDecoration: "none", fontSize: "0.9rem" }}>⚙️ Panel Admin</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "2rem",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.3)", fontSize: "0.8rem",
      }}>
        <p>Paseo Aranjuez — Ecosistema Digital · Desarrollado para Hackathon 2024</p>
        <p style={{ marginTop: "0.3rem", color: "rgba(255,255,255,0.15)" }}>
          Paseo Aranjuez no necesita tres apps. Necesita un ecosistema.
        </p>
      </footer>
    </main>
  )
}
