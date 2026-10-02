"use client"
import { useEffect, useState } from "react"
import QRCode from "qrcode"

interface QRCodeDisplayProps {
  value: string
  size?: number
  label?: string
}

export function QRCodeDisplay({ value, size = 180, label }: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>("")

  useEffect(() => {
    if (!value) return
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: "#1e1b4b",
        light: "#ffffff",
      },
    })
      .then(setDataUrl)
      .catch((err) => console.error("Error generating QR:", err))
  }, [value, size])

  if (!dataUrl) {
    return (
      <div style={{
        width: size, height: size,
        background: "rgba(255,255,255,0.05)",
        borderRadius: "12px", display: "flex",
        alignItems: "center", justifyContent: "center",
        color: "rgba(255,255,255,0.3)", fontSize: "0.8rem"
      }}>
        Cargando QR...
      </div>
    )
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        display: "inline-block",
        padding: "10px",
        background: "#ffffff",
        borderRadius: "14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={label || "Código QR"} style={{ display: "block", width: size, height: size, borderRadius: "6px" }} />
      </div>
      {label && (
        <p style={{ margin: "8px 0 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
          {label}
        </p>
      )}
    </div>
  )
}