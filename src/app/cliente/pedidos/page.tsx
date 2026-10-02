"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePaseoAuth } from "@/context/paseo/AuthContext"
import { QRCodeDisplay } from "@/components/QRCodeDisplay"
import { useRealtimeOrders } from "@/lib/paseo/useRealtime"
import { toast } from "sonner"

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  subtotal: number
  product?: { name: string; image_url?: string }
}

interface Order {
  id: string
  pickup_code: string
  qr_token: string
  status: string
  total: number
  points_earned: number
  created_at: string
  store?: { name: string; floor?: string; sector?: string; local_num?: string }
  items?: OrderItem[]
}

export default function PedidosPage() {
  const { user } = usePaseoAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/paseo/pedidos")
      const data = await res.json()
      if (data.orders) {
        setOrders(data.orders)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Escuchar WebSocket en tiempo real
  useRealtimeOrders(
    useCallback((updatedOrder: any) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
      )

      const statusMap: Record<string, string> = {
        preparando: "Tu pedido está en preparación 👨‍🍳",
        listo: "¡Tu pedido está listo para recoger en la tienda! 🛍️",
        entregado: "¡Pedido entregado con éxito! 🎉",
      }

      if (statusMap[updatedOrder.status]) {
        toast.success(statusMap[updatedOrder.status], {
          description: `Código: ${updatedOrder.pickup_code}`,
        })
      }
    }, [])
  )

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; color: string; label: string }> = {
      recibido: { bg: "rgba(124, 58, 237, 0.2)", color: "#c4b5fd", label: "Recibido" },
      confirmado: { bg: "rgba(59, 130, 246, 0.2)", color: "#93c5fd", label: "Confirmado" },
      preparando: { bg: "rgba(245, 158, 11, 0.2)", color: "#fcd34d", label: "En Preparación" },
      listo: { bg: "rgba(16, 185, 129, 0.25)", color: "#34d399", label: "¡Listo para Recoger!" },
      entregado: { bg: "rgba(107, 114, 128, 0.2)", color: "#9ca3af", label: "Entregado" },
      cancelado: { bg: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", label: "Cancelado" },
    }
    const c = config[status] || config.recibido
    return (
      <span style={{
        background: c.bg, color: c.color, padding: "4px 12px",
        borderRadius: "99px", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.5px"
      }}>
        {c.label}
      </span>
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
      {/* Navbar */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)", background: "rgba(11,10,22,0.8)", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/cliente" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.9rem" }}>
            ← Catálogo PaseoYa
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🛍️</span>
            <h1 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Mis Pedidos en Vivo</h1>
            <span style={{
              background: "rgba(16, 185, 129, 0.2)", color: "#34d399",
              padding: "2px 8px", borderRadius: "99px", fontSize: "0.68rem", fontWeight: 700
            }}>WEBSOCKETS</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.8rem" }}>
          <Link href="/cliente/puntos" style={{
            padding: "0.45rem 1rem", borderRadius: "8px",
            background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
            color: "#fcd34d", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600,
          }}>⭐ {user?.points ?? 0} Pts</Link>
          <Link href="/jarvis" style={{
            padding: "0.45rem 1rem", borderRadius: "8px",
            background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
            color: "#34d399", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600,
          }}>🤖 Jarvis</Link>
        </div>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        
        {/* Modal de Detalle con QR */}
        {selectedOrder && (
          <div style={{
            background: "rgba(21, 19, 41, 0.95)", border: "1px solid rgba(139, 92, 246, 0.4)",
            borderRadius: "24px", padding: "2rem", marginBottom: "2.5rem",
            boxShadow: "0 25px 50px rgba(0,0,0,0.6)", backdropFilter: "blur(20px)",
            position: "relative",
          }}>
            <button
              onClick={() => setSelectedOrder(null)}
              style={{
                position: "absolute", top: "16px", right: "16px",
                background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
                borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer"
              }}
            >
              ✕
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "2rem", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
                    {selectedOrder.store?.name || "Tienda Paseo Aranjuez"}
                  </h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                <p style={{ color: "#a78bfa", fontSize: "0.85rem", margin: "0 0 1.2rem 0" }}>
                  📍 {selectedOrder.store?.floor || "Piso 1"} • {selectedOrder.store?.sector || "Sector A"} • {selectedOrder.store?.local_num || "Local"}
                </p>

                <div style={{
                  background: "rgba(0,0,0,0.35)", padding: "14px", borderRadius: "12px",
                  border: "1px dashed rgba(139, 92, 246, 0.4)", marginBottom: "1.2rem",
                }}>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700 }}>
                    Código de Retiro en Tienda
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#a78bfa", letterSpacing: "2px", fontFamily: "monospace" }}>
                    {selectedOrder.pickup_code}
                  </div>
                </div>

                <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Puntos ganados:</span>
                    <span style={{ color: "#fbbf24", fontWeight: 700 }}>+{selectedOrder.points_earned} Pts</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 800, color: "#fff", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <span>Total Pagado:</span>
                    <span style={{ color: "#34d399" }}>Bs. {Number(selectedOrder.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <QRCodeDisplay value={selectedOrder.qr_token} size={160} label="QR de Retiro en Caja" />
              </div>
            </div>
          </div>
        )}

        {/* Lista de Pedidos */}
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 1.2rem 0" }}>Historial de Compras</h2>

        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Cargando pedidos en tiempo real...</p>
        ) : orders.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px", padding: "3rem", textAlign: "center",
          }}>
            <p style={{ fontSize: "2rem", margin: "0 0 10px 0" }}>🛒</p>
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 8px 0" }}>Aún no tienes pedidos</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", margin: "0 0 1.5rem 0" }}>
              Explora las tiendas de Paseo Aranjuez y realiza tu primera compra para ganar 50 puntos extra.
            </p>
            <Link href="/cliente" style={{
              display: "inline-block", padding: "0.8rem 1.8rem", borderRadius: "12px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff",
              textDecoration: "none", fontWeight: 700, fontSize: "0.95rem"
            }}>Explorar Tiendas en PaseoYa</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {orders.map((o) => (
              <div
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "18px", padding: "1.4rem 1.6rem",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  cursor: "pointer", transition: "transform 0.15s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                      {o.store?.name || "Tienda Paseo"}
                    </h3>
                    {getStatusBadge(o.status)}
                  </div>
                  <p style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "#a78bfa" }}>
                    Código: <strong style={{ fontFamily: "monospace" }}>{o.pickup_code}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                    {new Date(o.created_at).toLocaleDateString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#34d399", marginBottom: "4px" }}>
                    Bs. {Number(o.total).toFixed(2)}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#fbbf24", fontWeight: 600 }}>
                    +{o.points_earned} Pts
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                    Toca para ver QR →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}