"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category?: string
  is_featured?: boolean
  is_active?: boolean
  store?: { name: string }
}

export default function ComercioProductosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "10", category: "tecnologia" })
  const [saving, setSaving] = useState(false)

  async function loadProducts() {
    try {
      const res = await fetch("/api/paseo/productos")
      const data = await res.json()
      if (data.products) setProducts(data.products)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      // First get a default store ID if not provided
      const storesRes = await fetch("/api/paseo/tiendas").then(r => r.json())
      const storeId = storesRes.stores?.[0]?.id

      const res = await fetch("/api/paseo/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: storeId,
          name: form.name,
          description: form.description,
          price: Number(form.price),
          stock: Number(form.stock),
          category: form.category,
          is_active: true,
        }),
      })

      const data = await res.json()
      if (data.error) {
        toast.error("Error al publicar producto", { description: data.error })
      } else {
        toast.success("¡Producto publicado con éxito en PaseoYa!")
        setShowAddModal(false)
        setForm({ name: "", description: "", price: "", stock: "10", category: "tecnologia" })
        loadProducts()
      }
    } catch (err: any) {
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
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
          <Link href="/comercio" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "0.9rem" }}>
            ← Despacho de Pedidos
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.4rem" }}>📦</span>
            <h1 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Gestor de Productos PaseoYa</h1>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "0.55rem 1.3rem", borderRadius: "10px",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            border: "none", color: "#fff", fontWeight: 700, fontSize: "0.88rem",
            cursor: "pointer", boxShadow: "0 4px 15px rgba(124, 58, 237, 0.4)",
          }}
        >
          + Nuevo Producto
        </button>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        
        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Cargando inventario...</p>
        ) : products.length === 0 ? (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px", padding: "3rem", textAlign: "center",
          }}>
            <p style={{ fontSize: "2rem", margin: "0 0 10px 0" }}>📦</p>
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 8px 0" }}>No hay productos cargados</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", margin: "0 0 1.5rem 0" }}>
              Publica el primer producto de tu tienda para que los visitantes lo compren desde PaseoYa.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "0.75rem 1.6rem", borderRadius: "12px",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                border: "none", color: "#fff", fontWeight: 700, cursor: "pointer"
              }}
            >
              Publicar Producto
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.2rem" }}>
            {products.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "18px", padding: "1.4rem", display: "flex", flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#a78bfa", fontWeight: 600 }}>
                    {p.store?.name || "Paseo Aranjuez"}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                    Stock: {p.stock}
                  </span>
                </div>

                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.3rem 0" }}>{p.name}</h4>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", lineHeight: 1.4, flex: 1, margin: "0 0 1rem 0" }}>
                  {p.description}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#34d399" }}>
                    Bs. {Number(p.price).toFixed(2)}
                  </div>
                  <span style={{
                    background: "rgba(16, 185, 129, 0.2)", color: "#34d399",
                    padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700
                  }}>
                    Publicado
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Nuevo Producto */}
        {showAddModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1.5rem"
          }}>
            <div style={{
              background: "#151329", border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "24px", maxWidth: "480px", width: "100%", padding: "2rem",
              boxShadow: "0 25px 50px rgba(0,0,0,0.8)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Publicar Producto en PaseoYa</h3>
                <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
              </div>

              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Nombre del producto</label>
                  <input
                    type="text" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Auriculares Bluetooth Pro"
                    style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Descripción</label>
                  <textarea
                    required value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Breve descripción para el catálogo..."
                    style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", outline: "none", boxSizing: "border-box", minHeight: "80px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Precio (Bs.)</label>
                    <input
                      type="number" step="0.5" required value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="120"
                      style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>Stock disponible</label>
                    <input
                      type="number" required value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      placeholder="10"
                      style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "0.9rem", borderRadius: "12px",
                    background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none",
                    color: "#fff", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(124, 58, 237, 0.4)", marginTop: "0.5rem",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Guardando..." : "Publicar en PaseoYa"}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}