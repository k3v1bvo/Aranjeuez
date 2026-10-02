import nodemailer from "nodemailer"

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com"
  const port = Number(process.env.SMTP_PORT) || 465
  const user = process.env.SMTP_USER || ""
  const pass = (process.env.SMTP_PASSWORD || "").replace(/\s+/g, "")

  if (host.includes("gmail")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    })
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

const FROM_NAME = process.env.SMTP_FROM_NAME || "Paseo Aranjuez"
const FROM_EMAIL = process.env.SMTP_USER || ""
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://aranjuez.vercel.app"

export async function sendPaseoWelcomeEmail(to: string, name: string, points: number = 50) {
  try {
    const transporter = getTransporter()
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0a16; color: #f3f4f6; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background-color: #151329; border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
        .header { background: linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%); padding: 36px 28px; text-align: center; }
        .badge { display: inline-block; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 5px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .title { color: #ffffff; font-size: 26px; font-weight: 800; margin: 14px 0 6px 0; }
        .subtitle { color: #c4b5fd; font-size: 14px; margin: 0; }
        .body-content { padding: 32px 28px; }
        .text { color: #d1d5db; font-size: 15px; line-height: 1.6; }
        .bonus-box { background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 14px; padding: 22px; margin: 24px 0; text-align: center; }
        .points-number { font-size: 40px; font-weight: 900; color: #fbbf24; line-height: 1; margin: 8px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; margin-top: 10px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); }
        .footer { background-color: #0d0c1c; padding: 24px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">Bienvenido al Club Paseo</span>
          <h1 class="title">¡Hola, ${name}!</h1>
          <p class="subtitle">Paseo Aranjuez • Cochabamba, Bolivia</p>
        </div>
        <div class="body-content">
          <p class="text">
            Te damos la bienvenida al nuevo <strong>Ecosistema Digital de Paseo Aranjuez</strong>. Ahora puedes comprar en todas las tiendas del centro comercial, hacer retiros rápidos con QR y acumular puntos en cada compra.
          </p>
          <div class="bonus-box">
            <span style="font-size: 13px; text-transform: uppercase; color: #e9d5ff; font-weight: 600; letter-spacing: 1px;">Regalo de Bienvenida</span>
            <div class="points-number">+${points} Puntos</div>
            <p style="margin: 0; color: #fef08a; font-size: 13px;">Acreditados automáticamente en tu cuenta nivel <strong>Bronce</strong></p>
          </div>
          <div style="text-align: center; margin: 30px 0 10px 0;">
            <a href="${APP_URL}/cliente" class="btn">Explorar Tiendas en PaseoYa</a>
          </div>
        </div>
        <div class="footer">
          © 2026 Paseo Aranjuez • Av. América Este #1234, Cochabamba, Bolivia<br>
          <a href="${APP_URL}" style="color: #a78bfa; text-decoration: none; margin-top: 6px; display: inline-block;">${APP_URL}</a>
        </div>
      </div>
    </body>
    </html>
    `
    return await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL || user}>`,
      to,
      subject: "🎉 ¡Bienvenido al Club Paseo Aranjuez! Tienes puntos de regalo",
      html,
    })
  } catch (err) {
    console.error("Error sending welcome email:", err)
    return null
  }
}

export async function sendPaseoOrderEmail(opts: {
  to: string
  name: string
  orderId: string
  pickupCode: string
  total: number
  pointsEarned: number
  storeName?: string
  status?: string
}) {
  try {
    const transporter = getTransporter()
    const { to, name, orderId, pickupCode, total, pointsEarned, storeName, status } = opts
    const statusLabel =
      status === "preparando"
        ? "En preparación"
        : status === "listo"
        ? "¡Listo para Recoger en Tienda!"
        : "Recibido y confirmado"

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0a16; color: #f3f4f6; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background-color: #151329; border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
        .header { background: linear-gradient(135deg, #059669 0%, #1e1b4b 100%); padding: 36px 28px; text-align: center; }
        .badge { display: inline-block; background: rgba(52, 211, 153, 0.2); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.4); padding: 5px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .title { color: #ffffff; font-size: 24px; font-weight: 800; margin: 14px 0 6px 0; }
        .body-content { padding: 32px 28px; }
        .order-info { background: #1c1936; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; margin: 20px 0; }
        .code-box { background: rgba(124, 58, 237, 0.2); border: 2px dashed #8b5cf6; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0; }
        .code { font-size: 32px; font-weight: 900; letter-spacing: 4px; color: #a78bfa; font-family: monospace; }
        .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #ffffff; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; margin-top: 12px; }
        .footer { background-color: #0d0c1c; padding: 24px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 12px; color: #9ca3af; }
        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">${statusLabel}</span>
          <h1 class="title">Pedido en Paseo Aranjuez</h1>
          <p style="color: #a7f3d0; margin: 0; font-size: 14px;">${storeName || "PaseoYa Marketplace"}</p>
        </div>
        <div class="body-content">
          <p style="color: #d1d5db; font-size: 15px;">Hola <strong>${name}</strong>, tu pedido ha sido registrado con éxito en Paseo Aranjuez.</p>
          
          <div class="code-box">
            <div style="font-size: 12px; text-transform: uppercase; color: #c4b5fd; font-weight: 700; margin-bottom: 6px;">Código de Retiro en Tienda</div>
            <div class="code">${pickupCode}</div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 6px;">Muestra este código o tu QR en el local para recoger tu compra</div>
          </div>

          <div class="order-info">
            <div style="display: flex; justify-content: space-between; color: #9ca3af; font-size: 14px; margin-bottom: 8px;">
              <span>Orden:</span>
              <span style="font-family: monospace; color: #fff;">${orderId.substring(0, 8)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #9ca3af; font-size: 14px; margin-bottom: 8px;">
              <span>Puntos ganados:</span>
              <span style="color: #fbbf24; font-weight: 700;">+${pointsEarned} Pts</span>
            </div>
            <div class="total-row">
              <span>Total a pagar / pagado:</span>
              <span style="color: #34d399;">Bs. ${Number(total).toFixed(2)}</span>
            </div>
          </div>

          <div style="text-align: center; margin: 26px 0;">
            <a href="${APP_URL}/cliente/pedidos" class="btn">Ver Estado en Vivo (WebSocket)</a>
          </div>
        </div>
        <div class="footer">
          © 2026 Paseo Aranjuez • Av. América Este #1234, Cochabamba, Bolivia<br>
          Atención al Cliente: WhatsApp +591 71234567
        </div>
      </div>
    </body>
    </html>
    `
    return await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL || user}>`,
      to,
      subject: `🛍️ Pedido ${pickupCode} - Paseo Aranjuez (${statusLabel})`,
      html,
    })
  } catch (err) {
    console.error("Error sending order email:", err)
    return null
  }
}