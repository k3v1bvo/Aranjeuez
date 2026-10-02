"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePaseoAuth } from "@/context/paseo/AuthContext"
import { QRCodeDisplay } from "@/components/QRCodeDisplay"
import { useRealtimePoints } from "@/lib/paseo/useRealtime"
import { toast } from "sonner"

interface Reward {
  id: string
  name: string
  description: string
  points_cost: number
  category: string
  stock: number
}

interface Redemption {
  id: string
  coupon_code: string
  qr_token: string
  status: string
  created_at: string
  reward: Reward
}

interface PointMovement {
  id: string
  amount: number
  reason: string
  created_at: string
  store?: { name: string }
}

export default function PuntosPage() {
  const { user, refreshUser } = usePaseoAuth()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [movements, setMovements] = useState<PointMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [selectedCoupon, setSelectedCoupon] = useState<Redemption | null>(null)

  // Escuchar cambios en vivo por WebSockets
  useRealtimePoints(user?.id, (movement) => {
    toast.success(`⭐ ¡Puntos actualizados! +${movement.amount} Pts`, {
      description: movement.reason,
    })
    refreshUser()
    loadData()
  })

  async function loadData() {
    try {
      const res = await fetch("/api/paseo/puntos")
      const data = await res.json()
      if (data.rewards) setRewards(data.rewards)
      if (data.redemptions) setRedemptions(data.redemptions)
      if (data.movements) setMovements(data.movements)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleRedeem(rewardId: string) {
    setRedeemingId(rewardId)
    try {
      const res = await fetch("/api/paseo/puntos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error("No se pudo canjear", { description: data.error })
      } else {
        toast.success("¡Cupón canjeado con éxito!", {
          description: `Código: ${data.redemption.coupon_code}`,
        })
        setSelectedCoupon(data.redemption)
        refreshUser()
        loadData()
      }
    } catch (err: any) {
      toast.error("Error en la solicitud")
    } finally {
      setRedeemingId(null)
    }
  }

  const currentPoints = user?.points ?? 0
  const tier = currentPoints >= 3000 ? "Platino" : currentPoints >= 1500 ? "Oro" : currentPoints >= 500 ? "Plata" : "Bronce"
  const nextTierPoints = tier === "Bronce" ? 500 : tier === "Plata" ? 1500 : tier === "Oro" ? 3000 : 3000
  const tierProgress = Math.min(100, Math.round((currentPoints / nextTierPoints) * 100))

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0b0a16 0%, #151230 50%, #0d0c1c 100%)",
      color: "#f3f4f6",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      paddingBottom: "4rem",
    }}>
      {/* Navbar */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)", background: "rgba(11,10,22,0.8)", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/cliente" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.9rem" }}>
            ← Volver a PaseoYa
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.4rem" }}>⭐</span>
            <h1 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Club Paseo Points</h1>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.8rem" }}>
          <Link href="/cliente/pedidos" style={{
            padding: "0.45rem 1rem", borderRadius: "8px",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff", textDecoration: "none", fontSize: "0.85rem",
          }}>Mis Pedidos</Link>
          <Link href="/jarvis" style={{
            padding: "0.45rem 1rem", borderRadius: "8px",
            background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
            color: "#34d399", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600,
          }}>🤖 Jarvis IA</Link>
        </div>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        
        {/* Banner Tarjeta de Nivel + QR de Cliente */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.8rem",
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)",
          border: "1px solid rgba(245, 158, 11, 0.35)", borderRadius: "24px", padding: "2rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)", marginBottom: "3rem",
        }}>
          <div>
            <div style={{
              display: "inline-block", background: "rgba(245, 158, 11, 0.2)",
              color: "#fbbf24", padding: "4px 14px", borderRadius: "99px",
              fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
              marginBottom: "1rem",
            }}>
              Membresía Paseo • Nivel {tier}
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem" }}>{user?.name || "Cliente Paseo"}</h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.95rem", margin: "0 0 1.5rem" }}>
              Acumula 1 punto por cada Bs. 1 gastado en cualquier comercio de Paseo Aranjuez.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "6px" }}>
                <span>Balance: <strong style={{ color: "#fbbf24", fontSize: "1.2rem" }}>{currentPoints} Puntos</strong></span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Meta {nextTierPoints} Pts</span>
              </div>
              <div style={{ width: "100%", height: "10px", background: "rgba(255,255,255,0.1)", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{
                  width: `${tierProgress}%`, height: "100%",
                  background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                  borderRadius: "99px", transition: "width 0.5s ease",
                }} />
              </div>
            </div>

            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              ⚡ <strong>Multiplicador de Cumpleaños:</strong> Ganas 2x puntos durante todo el mes de tu cumpleaños.
            </div>
          </div>

          {/* QR de Membresía */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <QRCodeDisplay
              value={user?.qr_token || "cliente-paseo-001"}
              size={170}
              label="Escanea en caja para acumular puntos"
            />
          </div>
        </div>

        {/* Modal / Alerta de Cupón Canjeado */}
        {selectedCoupon && (
          <div style={{
            background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "20px", padding: "1.8rem", marginBottom: "2.5rem",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem"
          }}>
            <div>
              <div style={{ color: "#34d399", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>
                🎉 ¡Cupón Activo Listo para Usar!
              </div>
              <h3 style={{ fontSize: "1.4rem", margin: "6px 0" }}>{selectedCoupon.reward.name}</h3>
              <p style={{ color: "rgba(255,255,255,0.7)", margin: "0 0 10px 0", fontSize: "0.9rem" }}>
                Muestra este código o el código QR al pagar en cualquier tienda participante.
              </p>
              <div style={{
                fontFamily: "monospace", fontSize: "1.6rem", fontWeight: 900,
                color: "#34d399", background: "rgba(0,0,0,0.3)", padding: "6px 14px",
                borderRadius: "8px", display: "inline-block", letterSpacing: "2px",
              }}>
                {selectedCoupon.coupon_code}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <QRCodeDisplay value={selectedCoupon.qr_token} size={130} label="QR de Canje" />
              <button
                onClick={() => setSelectedCoupon(null)}
                style={{
                  marginTop: "8px", background: "transparent", border: "none",
                  color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline"
                }}
              >
                Cerrar vista previa
              </button>
            </div>
          </div>
        )}

        {/* Catálogo de Recompensas */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1.2rem 0" }}>Catálogo de Recompensas</h2>
          {loading ? (
            <p style={{ color: "rgba(255,255,255,0.4)" }}>Cargando catálogo...</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.2rem" }}>
              {rewards.map((r) => {
                const canAfford = currentPoints >= r.points_cost
                return (
                  <div
                    key={r.id}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "18px", padding: "1.5rem",
                      display: "flex", flexDirection: "column",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                      <span style={{
                        background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24",
                        padding: "4px 10px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: 700
                      }}>
                        ⭐ {r.points_cost} Pts
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>
                        {r.category}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.4rem 0" }}>{r.name}</h3>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", lineHeight: 1.5, flex: 1, margin: "0 0 1.2rem 0" }}>
                      {r.description}
                    </p>

                    <button
                      onClick={() => handleRedeem(r.id)}
                      disabled={!canAfford || redeemingId === r.id}
                      style={{
                        padding: "0.75rem", borderRadius: "10px",
                        background: canAfford ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255,255,255,0.08)",
                        border: "none", color: canAfford ? "#fff" : "rgba(255,255,255,0.3)",
                        fontWeight: 700, fontSize: "0.9rem", cursor: canAfford ? "pointer" : "not-allowed",
                        boxShadow: canAfford ? "0 4px 15px rgba(245, 158, 11, 0.3)" : "none",
                      }}
                    >
                      {redeemingId === r.id ? "Canjeando..." : canAfford ? "Canjear Ahora" : "Puntos insuficientes"}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Historial de Puntos */}
        <section>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1rem 0" }}>Historial de Movimientos</h2>
          {movements.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>Aún no tienes movimientos registrados.</p>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px", overflow: "hidden",
            }}>
              {movements.map((m, idx) => (
                <div
                  key={m.id || idx}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "1rem 1.4rem", borderBottom: idx < movements.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <div>
                    <p style={{ margin: "0 0 3px 0", fontWeight: 600, fontSize: "0.95rem" }}>{m.reason}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                      {new Date(m.created_at).toLocaleDateString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div style={{
                    fontWeight: 800, fontSize: "1.1rem",
                    color: m.amount > 0 ? "#34d399" : "#f87171",
                  }}>
                    {m.amount > 0 ? `+${m.amount}` : m.amount} Pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}