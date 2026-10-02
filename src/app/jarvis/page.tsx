"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePaseoAuth } from "@/context/paseo/AuthContext"

interface Message {
  role: "user" | "assistant"
  content: string
  time?: string
}

export default function JarvisPage() {
  const { user } = usePaseoAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy Jarvis, el asistente inteligente de Paseo Aranjuez. 🏬✨\n\nPuedo orientarte con la ubicación de tiendas (pisos y sectores), horarios, catálogo de productos de PaseoYa o cómo ganar y canjear tus Paseo Points. ¿En qué puedo ayudarte hoy?",
      time: "Ahora",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const quickQuestions = [
    "📍 ¿Dónde está TechZone y qué horario tiene?",
    "☕ ¿Qué opciones de cafetería o comida hay?",
    "⭐ ¿Cómo canjeo mis puntos del Club?",
    "👓 ¿Tienen ópticas en el centro comercial?",
  ]

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function handleSend(textToSend?: string) {
    const text = textToSend || input
    if (!text.trim() || loading) return

    const userMsg: Message = {
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/paseo/jarvis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Disculpa, tuve un pequeño inconveniente consultando el catálogo del centro comercial. ¿Podrías intentar nuevamente?",
            time: "Ahora",
          },
        ])
      }
    } catch (err) {
      console.error("Jarvis error:", err)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "No pude conectar con el servidor central de Paseo Aranjuez. Revisa tu conexión a internet.",
          time: "Ahora",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0b0a16 0%, #151230 50%, #0d0c1c 100%)",
      color: "#f3f4f6",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 2rem",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        background: "rgba(11,10,22,0.8)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.9rem" }}>
            ← Inicio
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div style={{
              width: "40px", height: "40px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.3rem", boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
            }}>🤖</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Jarvis Paseo</h1>
                <span style={{
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  padding: "2px 8px",
                  borderRadius: "99px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}>EN VIVO</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>
                IA Oficial • Paseo Aranjuez Cochabamba
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
          <Link href="/cliente" style={{
            padding: "0.45rem 1rem", borderRadius: "8px",
            background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
            color: "#c4b5fd", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600,
          }}>🛍️ PaseoYa</Link>
          <Link href="/cliente/puntos" style={{
            padding: "0.45rem 1rem", borderRadius: "8px",
            background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
            color: "#fcd34d", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600,
          }}>⭐ {user?.points ?? 0} Pts</Link>
        </div>
      </header>

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        maxWidth: "850px",
        width: "100%",
        margin: "0 auto",
        padding: "1.5rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.2rem",
        overflowY: "auto",
      }}>
        {/* Quick prompt pills */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          padding: "0.5rem 0",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#e5e7eb",
                padding: "0.4rem 0.9rem",
                borderRadius: "20px",
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div style={{
              maxWidth: "80%",
              padding: "0.9rem 1.3rem",
              borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user"
                ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                : "rgba(255,255,255,0.06)",
              border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.1)",
              color: "#ffffff",
              fontSize: "0.95rem",
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              boxShadow: m.role === "user" ? "0 4px 15px rgba(124, 58, 237, 0.3)" : "none",
            }}>
              {m.content}
            </div>
            {m.time && (
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginTop: "4px", padding: "0 6px" }}>
                {m.time}
              </span>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#34d399", fontSize: "0.85rem", padding: "8px" }}>
            <div style={{
              width: "14px", height: "14px", borderRadius: "50%",
              border: "2px solid #34d399", borderTopColor: "transparent",
              animation: "spin 1s linear infinite"
            }} />
            <span>Jarvis está consultando la información de Paseo Aranjuez...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div style={{
        padding: "1rem 1.5rem",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(11,10,22,0.9)",
        backdropFilter: "blur(16px)",
      }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          style={{
            maxWidth: "850px",
            margin: "0 auto",
            display: "flex",
            gap: "0.8rem",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale a Jarvis por una tienda, piso, producto o tus puntos..."
            style={{
              flex: 1,
              padding: "0.85rem 1.2rem",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#ffffff",
              fontSize: "0.95rem",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: "0.85rem 1.6rem",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
              opacity: loading || !input.trim() ? 0.6 : 1,
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
            }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}