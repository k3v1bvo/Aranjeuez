"use client"
import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

export default function ScannerTerminal() {
  const [code, setCode] = useState("")
  const [scanType, setScanType] = useState<"order" | "user" | "coupon">("order")
  const [loading, setLoading] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setScanResult(null)

    try {
      const res = await fetch("/api/paseo/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrRaw: code.startsWith("http") || code.includes(":") ? code : `paseo:${scanType}:${code}`,
          pin: code.toUpperCase(),
          type: scanType,
        }),
      })

      const data = await res.json()
      if (data.error) {
        toast.error("Validación fallida", { description: data.error })
      } else {
        toast.success("¡Validación exitosa!")
        setScanResult(data)
      }
    } catch (err: any) {
      toast.error("Error al conectar con la terminal")
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
            ← Pedidos en Vivo
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.4rem" }}>📷</span>
            <h1 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Terminal de Validación • Caja</h1>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        
        {/* Selector de Tipo de Validación */}
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.8rem", background: "rgba(255,255,255,0.04)", padding: "6px", borderRadius: "14px" }}>
          {[
            { id: "order", label: "🛍️ Retiro de Pedido" },
            { id: "coupon", label: "🎟️ Canje de Cupón" },
            { id: "user", label: "⭐ Puntos Cliente" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setScanType(tab.id as any)
                setScanResult(null)
              }}
              style={{
                flex: 1, padding: "0.65rem", borderRadius: "10px", border: "none",
                background: scanType === tab.id ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "transparent",
                color: scanType === tab.id ? "#fff" : "rgba(255,255,255,0.6)",
                fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                boxShadow: scanType === tab.id ? "0 4px 15px rgba(124, 58, 237, 0.3)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Formulario de Entrada */}
        <div style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px", padding: "2rem", backdropFilter: "blur(16px)", marginBottom: "2rem",
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
            {scanType === "order" ? "Ingresa el Código de Retiro o Token QR" : scanType === "coupon" ? "Ingresa el Código de Cupón o Token QR" : "Token o QR de Cliente"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", margin: "0 0 1.5rem 0" }}>
            Pídele al cliente su pantalla en Paseo Aranjuez o lee su código QR.
          </p>

          <form onSubmit={handleValidate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={scanType === "order" ? "Ej: PASEO-1234" : "Ej: C4A1B2C3"}
              style={{
                padding: "0.9rem 1.2rem", borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.08)", color: "#fff",
                fontSize: "1.1rem", fontFamily: "monospace", letterSpacing: "1px",
                outline: "none", boxSizing: "border-box", textTransform: "uppercase",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.9rem", borderRadius: "12px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none",
                color: "#fff", fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)", opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Verificando..." : "Validar Código en Caja"}
            </button>
          </form>
        </div>

        {/* Resultado de Validación */}
        {scanResult && (
          <div style={{
            background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "20px", padding: "1.8rem",
          }}>
            <div style={{ color: "#34d399", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", marginBottom: "6px" }}>
              ✓ Registro Válido y Confirmado
            </div>

            {scanResult.order && (
              <div>
                <h3 style={{ fontSize: "1.3rem", margin: "0 0 6px 0" }}>
                  Pedido: {scanResult.order.pickup_code}
                </h3>
                <p style={{ margin: "0 0 4px 0", color: "#e5e7eb" }}>
                  Cliente: <strong>{scanResult.order.user?.name}</strong> ({scanResult.order.user?.phone || "Sin teléfono"})
                </p>
                <p style={{ margin: "0 0 8px 0", color: "#e5e7eb" }}>
                  Total a abonar: <strong style={{ color: "#34d399" }}>Bs. {Number(scanResult.order.total).toFixed(2)}</strong>
                </p>
                <div style={{ color: "#fbbf24", fontSize: "0.85rem", fontWeight: 600 }}>
                  ⭐ Genera +{scanResult.order.points_earned} Puntos al marcar como entregado.
                </div>
              </div>
            )}

            {scanResult.redemption && (
              <div>
                <h3 style={{ fontSize: "1.3rem", margin: "0 0 6px 0" }}>
                  Cupón: {scanResult.redemption.reward?.name}
                </h3>
                <p style={{ margin: "0 0 4px 0", color: "#e5e7eb" }}>
                  Código: <strong style={{ fontFamily: "monospace" }}>{scanResult.redemption.coupon_code}</strong>
                </p>
                <p style={{ margin: 0, color: "#a7f3d0", fontSize: "0.9rem" }}>
                  ¡Descuento aplicado correctamente en la cuenta de {scanResult.redemption.user?.name}!
                </p>
              </div>
            )}

            {scanResult.user && (
              <div>
                <h3 style={{ fontSize: "1.3rem", margin: "0 0 6px 0" }}>
                  Cliente: {scanResult.user.name}
                </h3>
                <p style={{ margin: "0 0 4px 0", color: "#fbbf24", fontWeight: 700 }}>
                  Nivel: {scanResult.user.level?.toUpperCase()} • Balance: {scanResult.user.points} Puntos
                </p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
                  Membresía activa en el Club Paseo Aranjuez.
                </p>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}