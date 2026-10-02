import { NextResponse } from 'next/server';
import { sendPaseoOrderEmail, sendPaseoWelcomeEmail } from '@/lib/paseo/email';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, to, name, orderId, pickupCode, total, pointsEarned, storeName, status, subject, message } = body;

    if (!to) {
      return NextResponse.json({ error: "Falta destinatario 'to'" }, { status: 400 });
    }

    if (type === 'welcome') {
      const res = await sendPaseoWelcomeEmail(to, name || 'Visitante', pointsEarned || 50);
      return NextResponse.json({ success: !!res });
    }

    if (type === 'order' || orderId) {
      const res = await sendPaseoOrderEmail({
        to,
        name: name || 'Cliente Paseo',
        orderId: orderId || 'ORD-000',
        pickupCode: pickupCode || 'PASEO-00',
        total: Number(total || 0),
        pointsEarned: Number(pointsEarned || 0),
        storeName: storeName || 'Paseo Aranjuez',
        status: status || 'recibido',
      });
      return NextResponse.json({ success: !!res });
    }

    // Generic fallback email
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const user = process.env.SMTP_USER || '';
    const pass = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');
    const fromName = process.env.SMTP_FROM_NAME || 'Paseo Aranjuez';

    if (!user || !pass) {
      return NextResponse.json({ error: "Credenciales SMTP no configuradas" }, { status: 500 });
    }

    const transporter = host.includes('gmail')
      ? nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
      : nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to,
      subject: subject || 'Notificación - Paseo Aranjuez',
      html: `<div style="font-family: sans-serif; padding: 20px; background: #0c0a1d; color: #fff;">
        <h2 style="color: #a78bfa;">Paseo Aranjuez</h2>
        <p>${message || 'Notificación del sistema.'}</p>
      </div>`,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}