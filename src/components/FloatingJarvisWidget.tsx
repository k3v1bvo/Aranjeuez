"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function FloatingJarvisWidget() {
  const pathname = usePathname()

  // Hide on jarvis page itself
  if (pathname === "/jarvis") return null

  return (
    <aside aria-label="Asistente Virtual" style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 9999,
    }}>
      <Link
        href="/jarvis"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 18px",
          borderRadius: "99px",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))",
          color: "#ffffff",
          textDecoration: "none",
          boxShadow: "0 8px 30px rgba(16, 185, 129, 0.45), 0 0 20px rgba(16, 185, 129, 0.3)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          fontWeight: 700,
          fontSize: "0.88rem",
          letterSpacing: "0.3px",
          transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06) translateY(-2px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1) translateY(0)")}
      >
        <span style={{
          width: "28px", height: "28px", borderRadius: "50%",
          background: "#ffffff", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "1.1rem",
        }}>🤖</span>
        <span>Jarvis IA</span>
      </Link>
    </aside>
  )
}