"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePaseoAuth } from "@/context/paseo/AuthContext"
import { useRealtimeOrders } from "@/lib/paseo/useRealtime"
import { toast } from "sonner"

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  product?: { name: string }
}

interface Order {
  id: string
  pickup_code: string
  status: string
  total: number
  points_earned: number
  created_at: string
  user?: { name: string; phone?: string; email: string }
  store?: { name: string }
  items?: OrderItem[]
}

export default function ComercioDashboard() {
  const { user } = usePaseoAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/paseo/pedidos")
      const data = await res.json()
      if (data.orders) setOrders(data.orders)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Escuchar nuevos pedidos o cambios de estado en vivo por WebSockets
  useRealtimeOrders(
    useCallback((newOrder: any) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === newOrder.id)
        if (exists) {
          if (newOrder.status === "llego") {
            toast.warning(`🚨 ¡El cliente del pedido ${newOrder.pickup_code} acaba de llegar al local!`, {
              duration: 8000,
            })
          }
          return prev.map((o) => (o.id === newOrder.id ? { ...o, ...newOrder } : o))
        }
        toast.info("🛎️ ¡Nuevo pedido recibido en PaseoYa!", {
          description: `Código: ${newOrder.pickup_code}`,
        })
        return [newOrder, ...prev]
      })
    }, [])
  )

  async function updateStatus(orderId: string, nextStatus: string) {
    setUpdatingId(orderId)
    try {
      const res = await fetch("/api/paseo/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: nextStatus }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error("Error al actualizar estado", { description: data.error })
      } else {
        toast.success(`Pedido actualizado a '${nextStatus}'`)
        loadOrders()
      }
    } catch (err: any) {
      toast.error("Error en la solicitud")
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "recibido": return "#a78bfa"
      case "preparando": return "#fcd34d"
      case "listo": return "#34d399"
      case "llego": return "#60a5fa"
      case "entregado": return "#9ca3af"
      default: return "#60a5fa"
    }
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
          <Link href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.9rem" }}>
            ← Inicio
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🏬</span>
            <h1 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Portal Comercio • Paseo Aranjuez</h1>
            <span style={{
              background: "rgba(16, 185, 129, 0.2)", color: "#34d399",
              padding: "2px 8px", borderRadius: "99px", fontSize: "0.68rem", fontWeight: 700
            }}>WEBSOCKETS ACTIVO</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.8rem" }}>
          <Link href="/comercio/productos" style={{
            padding: "0.5rem 1.2rem", borderRadius: "10px",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff", textDecoration: "none", fontSize: "0.88rem", fontWeight: 600,
          }}>📦 Mis Productos</Link>
          <Link href="/comercio/scanner" style={{
            padding: "0.5rem 1.2rem", borderRadius: "10px",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#fff", textDecoration: "none", fontSize: "0.88rem", fontWeight: 700,
            boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)"
          }}>📷 Terminal Escáner QR</Link>
        </div>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        
        {/* Banner Informativo */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px", padding: "1.5rem 2rem", marginBottom: "2rem",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem"
        }}>
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 4px 0" }}>Control de Pedidos y Despacho</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.88rem", margin: 0 }}>
              Sincronización en tiempo real vía <strong>WebSockets</strong> con notificación automática por <strong>Google SMTP</strong>.
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ textAlign: "center", background: "rgba(0,0,0,0.3)", padding: "10px 18px", borderRadius: "12px" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#34d399" }}>
                {orders.filter(o => o.status !== "entregado" && o.status !== "cancelado").length}
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>En Curso</div>
            </div>
            <div style={{ textAlign: "center", background: "rgba(0,0,0,0.3)", padding: "10px 18px", borderRadius: "12px" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fbbf24" }}>
                {orders.filter(o => o.status === "entregado").length}
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Completados</div>
            </div>
          </div>
        </div>

        {/* Lista de Pedidos de la Tienda */}
        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Cargando pedidos en vivo...</p>
        ) : orders.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px", padding: "3rem", textAlign: "center",
          }}>
            <p style={{ fontSize: "2rem", margin: "0 0 10px 0" }}>📦</p>
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 8px 0" }}>No hay pedidos registrados aún</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
              Haz una compra de prueba en el portal cliente para verla aparecer aquí al instante por WebSockets.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {orders.map((o) => {
              const isArrival = o.status === "llego"
              return (
                <div
                  key={o.id}
                  style={{
                    background: isArrival ? "rgba(59, 130, 246, 0.12)" : "rgba(255,255,255,0.04)",
                    border: isArrival ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "20px", padding: "1.6rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.2rem",
                    boxShadow: isArrival ? "0 0 25px rgba(59, 130, 246, 0.3)" : "none",
                  }}
                >
                  <div>
                    {isArrival && (
                      <div style={{
                        display: "inline-block", background: "#3b82f6", color: "#fff",
                        padding: "3px 10px", borderRadius: "6px", fontSize: "0.75rem",
                        fontWeight: 800, marginBottom: "8px", letterSpacing: "0.5px"
                      }}>
                        🚨 ¡EL CLIENTE ACABA DE LLEGAR AL LOCAL PARA RETIRAR!
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span style={{
                        fontFamily: "monospace", fontSize: "1.2rem", fontWeight: 900,
                        background: "rgba(124, 58, 237, 0.2)", color: "#c4b5fd",
                        padding: "4px 10px", borderRadius: "8px", border: "1px solid rgba(124, 58, 237, 0.4)"
                      }}>
                        {o.pickup_code}
                      </span>
                      <span style={{
                        background: `${getStatusColor(o.status)}22`, color: getStatusColor(o.status),
                        padding: "4px 12px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase"
                      }}>
                        {o.status}
                      </span>
                    </div>

                    <p style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 700 }}>
                      Cliente: {o.user?.name || "Visitante"} {o.user?.phone ? `(${o.user.phone})` : ""}
                    </p>
                    <p style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                      {o.items?.map(i => `${i.quantity}x ${i.product?.name || "Producto"}`).join(", ") || "Compra en tienda"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                      {new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Total: <strong style={{ color: "#34d399" }}>Bs. {Number(o.total).toFixed(2)}</strong> (+{o.points_earned} Pts)
                    </p>
                  </div>

                  {/* Acciones de Estado */}
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    {o.status === "recibido" && (
                      <button
                        onClick={() => updateStatus(o.id, "preparando")}
                        disabled={updatingId === o.id}
                        style={{
                          padding: "0.6rem 1.1rem", borderRadius: "10px",
                          background: "rgba(245, 158, 11, 0.2)", border: "1px solid #f59e0b",
                          color: "#fbbf24", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer"
                        }}
                      >
                        👨‍🍳 Marcar Preparando
                      </button>
                    )}

                    {(o.status === "recibido" || o.status === "preparando") && (
                      <button
                        onClick={() => updateStatus(o.id, "listo")}
                        disabled={updatingId === o.id}
                        style={{
                          padding: "0.6rem 1.1rem", borderRadius: "10px",
                          background: "linear-gradient(135deg, #10b981, #059669)", border: "none",
                          color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                          boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)"
                        }}
                      >
                        🛍️ ¡Listo para Recoger!
                      </button>
                    )}

                    {(o.status === "listo" || o.status === "llego") && (
                      <button
                        onClick={() => updateStatus(o.id, "entregado")}
                        disabled={updatingId === o.id}
                        style={{
                          padding: "0.65rem 1.3rem", borderRadius: "10px",
                          background: isArrival
                            ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                            : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                          border: "none", color: "#fff", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer",
                          boxShadow: "0 4px 15px rgba(124, 58, 237, 0.4)"
                        }}
                      >
                        ✓ Entregar y Acreditar Puntos
                      </button>
                    )}

                    {o.status === "entregado" && (
                      <span style={{ color: "#9ca3af", fontSize: "0.85rem", fontWeight: 600 }}>
                        ✓ Entregado y Puntos Asignados
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}