import QRCode from 'qrcode'

// Generar PIN de 6 digitos
export function generatePickupCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Generar token UUID para QR
export function generateQRToken(): string {
  return crypto.randomUUID()
}

// Generar imagen QR como data URL
export async function generateQRDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })
}

// Generar SVG del QR
export async function generateQRSvg(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: 'svg',
    width: 200,
    margin: 1,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  })
}

// Construir el contenido del QR para un pedido
export function buildOrderQRContent(qrToken: string, orderId: string): string {
  return JSON.stringify({ type: 'order', qrToken, orderId })
}

// Construir el contenido del QR personal del cliente
export function buildUserQRContent(qrToken: string, userId: string): string {
  return JSON.stringify({ type: 'user', qrToken, userId })
}

// Construir el contenido del QR de cupon de canje
export function buildCouponQRContent(qrToken: string, couponCode: string): string {
  return JSON.stringify({ type: 'coupon', qrToken, couponCode })
}

// Parsear QR escaneado
export function parseQRContent(raw: string): {
  type: 'order' | 'user' | 'coupon' | 'unknown'
  qrToken?: string
  orderId?: string
  userId?: string
  couponCode?: string
} {
  try {
    const parsed = JSON.parse(raw)
    return parsed
  } catch {
    return { type: 'unknown' }
  }
}
