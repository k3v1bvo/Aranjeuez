"use client"
import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePaseoAuth } from "@/context/paseo/AuthContext"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category?: string
  image_url?: string
}

interface Store {
  id: string
  name: string
  description: string
  category: string
  floor: string
  sector: string
  local_num: string
  schedule: string
  image_url?: string
}

export default function StoreCatalogPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const storeId = resolvedParams.id
  const { user } = usePaseoAuth()
  const router = useRouter()

  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [ordering, setOrdering] = useState(false)

  useEffect(() => {
    async function loadStore() {
      try {
        const [storesRes, prodsRes] = await Promise.all([
          fetch("/api/paseo/tiendas").then((r) => r.json()),
          fetch(`/api/paseo/productos?storeId=${storeId}`).then((r) => r.json()),
        ])

        const current = (storesRes.stores || []).find((s: Store) => s.id === storeId)
        setStore(current || null)
        setProducts(prodsRes.products || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadStore()
  }, [storeId])

  function addToCart(product: Product) {
    setCart((prev) => {
      const exists = prev.find((item) => item.product.id === product.id)
      if (exists) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    toast.success(`Agregado: ${product.name}`, { duration: 1500 })
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const pointsToEarn = Math.floor(cartTotal)

  async function handleCreateOrder() {
    if (!user) {
      toast.error("Debes iniciar sesión para comprar")
      router.push("/auth/login")
      return
    }

    if (cart.length === 0) return

    setOrdering(true)
    try {
      const res = await fetch("/api/paseo/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          paymentMethod: "qr",
        }),
      })

      const data = await res.json()
      if (data.error) {
        toast.error("Error al procesar el pedido", { description: data.error })
      } else {
        toast.success("¡Pedido creado exitosamente!", {
          description: `Código de retiro: ${data.order.pickup_code}`,
        })
        setCart([])
        setShowCheckout(false)
        router.push("/cliente/pedidos")
      }
    } catch (err: any) {
      toast.error("Error de conexión al procesar pedido")
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0a16", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Cargando tienda...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0b0a16 0%, #151230 50%, #0d0c1c 100%)",
      color: "#f3f4f6",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      paddingBottom: "6rem",
    }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)", background: "rgba(11,10,22,0.85)", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/cliente" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.9rem" }}>
            ← Todas las Tiendas
          </Link>
          <div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>{store?.name || "Tienda Paseo"}</h1>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#a78bfa" }}>
              📍 {store?.floor} • {store?.sector} • {store?.local_num}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {cart.length > 0 && (
            <button
              onClick={() => setShowCheckout(true)}
              style={{
                padding: "0.55rem 1.3rem", borderRadius: "12px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none", color: "#fff", fontWeight: 700, fontSize: "0.9rem",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
              }}
            >
              🛒 Ver Carrito ({cart.reduce((a, b) => a + b.quantity, 0)}) • Bs. {cartTotal.toFixed(2)}
            </button>
          )}
          <Link href="/jarvis" style={{
            padding: "0.45rem 1rem", borderRadius: "8px",
            background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
            color: "#34d399", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600,
          }}>🤖 Jarvis</Link>
        </div>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        
        {/* Banner de Tienda */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124, 58, 237, 0.25)",
          borderRadius: "24px", padding: "2rem", marginBottom: "2.5rem", backdropFilter: "blur(14px)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span style={{
                background: "rgba(124, 58, 237, 0.2)", color: "#c4b5fd",
                padding: "4px 12px", borderRadius: "99px", fontSize: "0.75rem",
                fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
              }}>
                {store?.category}
              </span>
              <h2 style={{ fontSize: "2rem", fontWeight: 900, margin: "0.6rem 0 0.4rem 0" }}>{store?.name}</h2>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.95rem", maxWidth: "600px", margin: "0 0 1rem 0" }}>
                {store?.description}
              </p>
              <div style={{ display: "flex", gap: "1.2rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                <span>🕒 {store?.schedule}</span>
                <span>⭐ Suma 1 Paseo Point por cada Bs. 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Catálogo de Productos */}
        <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 1.2rem 0" }}>Catálogo de Productos</h3>

        {products.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px", padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.5)"
          }}>
            Esta tienda aún no tiene productos publicados en PaseoYa.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.4rem" }}>
            {products.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "20px", padding: "1.4rem", display: "flex", flexDirection: "column",
                  transition: "transform 0.15s ease",
                }}
              >
                <div style={{
                  height: "120px", background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(79, 70, 229, 0.2))",
                  borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "2.5rem", marginBottom: "1rem"
                }}>
                  🛍️
                </div>

                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.3rem 0" }}>{p.name}</h4>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", lineHeight: 1.5, flex: 1, margin: "0 0 1rem 0" }}>
                  {p.description}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                  <div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#34d399" }}>
                      Bs. {Number(p.price).toFixed(2)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 600 }}>
                      +{Math.floor(p.price)} Pts
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(p)}
                    style={{
                      padding: "0.6rem 1.1rem", borderRadius: "10px",
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      border: "none", color: "#fff", fontWeight: 700, fontSize: "0.85rem",
                      cursor: "pointer", boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)",
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Checkout */}
        {showCheckout && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1.5rem"
          }}>
            <div style={{
              background: "#151329", border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "24px", maxWidth: "520px", width: "100%", padding: "2rem",
              boxShadow: "0 25px 50px rgba(0,0,0,0.8)", maxHeight: "90vh", overflowY: "auto"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Confirmar Pedido PaseoYa</h3>
                <button onClick={() => setShowCheckout(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {cart.map((item) => (
                  <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.6rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <p style={{ margin: "0 0 2px 0", fontWeight: 600, fontSize: "0.95rem" }}>{item.product.name}</p>
                      <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>Cantidad: {item.quantity}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: 700, color: "#34d399" }}>Bs. {(item.product.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.product.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.8rem" }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(0,0,0,0.3)", padding: "14px", borderRadius: "14px", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.9rem" }}>
                  <span>Puntos que acumulas:</span>
                  <span style={{ color: "#fbbf24", fontWeight: 700 }}>+{pointsToEarn} Pts</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 900, paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <span>Total a Pagar:</span>
                  <span style={{ color: "#34d399" }}>Bs. {cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div style={{
                background: "rgba(124, 58, 237, 0.15)", border: "1px solid rgba(124, 58, 237, 0.3)",
                borderRadius: "14px", padding: "12px", marginBottom: "1.5rem", fontSize: "0.85rem", color: "#c4b5fd"
              }}>
                ⚡ Al confirmar se generará tu <strong>Código PIN y QR de Retiro</strong> para recoger en {store?.local_num} sin colas.
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={ordering}
                style={{
                  width: "100%", padding: "0.95rem", borderRadius: "14px",
                  background: "linear-gradient(135deg, #10b981, #059669)", border: "none",
                  color: "#fff", fontWeight: 800, fontSize: "1rem", cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)", opacity: ordering ? 0.7 : 1,
                }}
              >
                {ordering ? "Generando Pedido..." : `Confirmar y Pagar (Bs. ${cartTotal.toFixed(2)})`}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}