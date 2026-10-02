import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

function getEnv(key: string): string {
  if (process.env[key]) return process.env[key] as string;
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const [k, ...v] = trimmed.split('=');
        if (k.trim() === key) {
          return v.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return '';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, title, message, orderId, total, items, freeGift, actionUrl, actionLabel, role } = body;

    const host = getEnv('SMTP_HOST') || 'smtp.gmail.com';
    const port = Number(getEnv('SMTP_PORT')) || 465;
    const user = getEnv('SMTP_USER') || getEnv('GMAIL_USER') || 'ayniprotocol@gmail.com';
    const pass = getEnv('SMTP_PASSWORD') || getEnv('GMAIL_APP_PASSWORD') || 'ujccnzxebbpqzhaw';
    const fromName = getEnv('SMTP_FROM_NAME') || 'Tienda Táctica Cochabamba';
    const baseUrl = getEnv('NEXT_PUBLIC_APP_URL') || 'https://tactical-nine.vercel.app';

    if (!user || !pass) {
      return NextResponse.json(
        {
          error: 'Credenciales SMTP de Google no configuradas en variables de entorno (SMTP_USER / SMTP_PASSWORD).',
        },
        { status: 500 }
      );
    }

    const transporter = host.includes('gmail')
      ? nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: user.trim(),
            pass: pass.replace(/\s+/g, ''),
          },
        })
      : nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user: user.trim(),
            pass: pass.replace(/\s+/g, ''),
          },
        });

    const resolvedActionUrl = actionUrl
      ? actionUrl.startsWith('http')
        ? actionUrl
        : `${baseUrl}${actionUrl.startsWith('/') ? '' : '/'}${actionUrl}`
      : null;

    const roleBadge = role === 'admin'
      ? 'CENTRO DE COMANDO · ADMIN'
      : role === 'driver'
      ? 'LOGÍSTICA & DESPACHO · MOTORIZADO'
      : 'TIENDA TÁCTICA COCHABAMBA · DESPACHO OFICIAL';

    const formattedMessage = message
      ? message.replace(/\n/g, '<br/>')
      : 'Notificación oficial sobre tu orden o cuenta en Tienda Táctica Bolivia.';

    // Dark Tactical Gold HTML Email Template
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050507; color: #F5F5F7; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background-color: #0c0c10; border: 1px solid rgba(200, 169, 97, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
        .header { background: linear-gradient(135deg, #14141a 0%, #0c0c10 100%); padding: 28px; border-bottom: 1px solid #22222a; text-align: center; }
        .badge { display: inline-block; background: rgba(200, 169, 97, 0.15); color: #C8A961; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: bold; letter-spacing: 1px; }
        .title { color: #ffffff; font-size: 21px; font-weight: 800; text-transform: uppercase; margin: 12px 0 4px 0; letter-spacing: 0.5px; }
        .body-content { padding: 28px; }
        .text { color: #A1A1AA; font-size: 14px; line-height: 1.6; }
        .order-box { background-color: #14141a; border: 1px solid #22222a; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #DEC07A; padding-top: 6px; }
        .gift-box { background: rgba(48, 164, 108, 0.12); border: 1px solid rgba(48, 164, 108, 0.3); border-radius: 10px; padding: 14px; margin: 16px 0; color: #30A46C; font-size: 13px; line-height: 1.5; }
        .footer { background-color: #07070a; padding: 20px; border-top: 1px solid #22222a; text-align: center; font-size: 11px; color: #5E5E68; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">${roleBadge}</span>
          <h1 class="title">${title || 'COMUNICADO OPERATIVO'}</h1>
          <p style="color: #7A7A85; font-size: 12px; margin: 0;">STANAG 4569 · BASE HEROÍNAS #560 · COCHABAMBA</p>
        </div>
        <div class="body-content">
          <p class="text">${formattedMessage}</p>
          
          ${orderId ? `
            <div class="order-box">
              <div style="font-size: 11px; color: #C8A961; font-weight: bold; margin-bottom: 8px;">CÓDIGO DE ORDEN: ${orderId}</div>
              ${total ? `<div class="total-row"><span>Total Orden:</span><span>Bs. ${Number(total).toFixed(2)}</span></div>` : ''}
            </div>
          ` : ''}

          ${freeGift ? `
            <div class="gift-box">
              <strong>🎁 Souvenir Táctico Sorpresa Incluido:</strong> Por haber realizado el abono del 100% mediante QR Simple, viaja un souvenir exclusivo de regalo dentro de tu paquete con precinto militar.
            </div>
          ` : ''}

          ${resolvedActionUrl ? `
            <div style="text-align: center; margin: 26px 0 16px 0;">
              <a href="${resolvedActionUrl}" style="display: inline-block; background-color: #C8A961; color: #000000; font-weight: 800; font-size: 12px; text-decoration: none; padding: 14px 28px; border-radius: 10px; letter-spacing: 0.5px; text-transform: uppercase;">
                ${actionLabel || 'ABRIR ENLACE EN LA TIENDA'}
              </a>
            </div>
          ` : ''}

          <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #1f1f26; text-align: center;">
            <a href="https://wa.me/59171234567?text=${encodeURIComponent(`Hola, me comunico sobre la orden ${orderId || 'de Tienda Táctica'}`)}" style="color: #25D366; font-size: 13px; text-decoration: none; font-weight: bold;">
              💬 Coordinación Directa por WhatsApp (+591 71234567)
            </a>
          </div>
        </div>
        <div class="footer">
          © 2026 Tienda Táctica Cochabamba · Av. Heroínas #560 · Bolivia<br/>
          <a href="${baseUrl}" style="color: #C8A961; text-decoration: none; margin-top: 4px; display: inline-block;">${baseUrl}</a>
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to,
      subject: subject || 'Notificación Oficial — Tienda Táctica Bolivia',
      html,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Error sending email with Google SMTP:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
