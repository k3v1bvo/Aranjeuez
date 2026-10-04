import 'server-only';
import nodemailer from 'nodemailer';

const FROM_NAME = process.env.SMTP_FROM_NAME || 'Paseo Aranjuez';
const FROM_EMAIL = process.env.SMTP_USER || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aranjuez.vercel.app';

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || '';
  const pass = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');
  if (!user || !pass) throw new Error('SMTP no configurado (SMTP_USER / SMTP_PASSWORD).');

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
  });
}

// 1. Bienvenida al Club Paseo Aranjuez
export async function sendPaseoWelcomeEmail(to: string, name: string, points: number = 0) {
  try {
    const transporter = getTransporter();
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #030B1A; color: #FFFFFF; margin: 0; padding: 24px; }
        .container { max-width: 580px; margin: 0 auto; background: #061734; border: 1px solid rgba(212, 162, 76, 0.3); border-radius: 20px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #061734 0%, #162447 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #FF6B1A; }
        .title { font-size: 24px; font-weight: 900; color: #FFFFFF; margin: 0; letter-spacing: 1px; }
        .subtitle { font-size: 13px; color: #D4A24C; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; }
        .body { padding: 32px 24px; line-height: 1.6; color: #E2E8F0; }
        .points-box { background: rgba(255, 107, 26, 0.1); border: 1px solid rgba(255, 107, 26, 0.4); border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
        .points-val { font-size: 38px; font-weight: 900; color: #FF6B1A; margin: 4px 0; font-family: monospace; }
        .btn { display: inline-block; background: linear-gradient(135deg, #B84D0B 0%, #FF6B1A 100%); color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; margin-top: 16px; text-align: center; }
        .footer { padding: 20px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid rgba(255, 255, 255, 0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">PASEO ARANJUEZ</h1>
          <div class="subtitle">Club de Beneficios & Puntos</div>
        </div>
        <div class="body">
          <p>Hola <strong>${name}</strong>,</p>
          <p>¡Te damos la bienvenida al ecosistema digital de <strong>Paseo Aranjuez</strong> en Cochabamba!</p>
          <p>Tu cuenta ha sido creada exitosamente y como agradecimiento te hemos acreditado tus puntos de bienvenida:</p>
          
          <div class="points-box">
            <div style="font-size: 12px; color: #D4A24C; text-transform: uppercase; font-weight: bold;">Bono de Bienvenida</div>
            <div class="points-val">+${points} PTS</div>
            <div style="font-size: 12px; color: #CBD5E1;">Nivel Bronce inicial desbloqueado</div>
          </div>

          <p>Podrás acumular más puntos en cada compra realizada en nuestros locales comerciales o mediante nuestro servicio <strong>PaseoYa (Click & Collect)</strong>.</p>

          <center>
            <a href="${APP_URL}/cliente/puntos" class="btn">Ver Mi Tarjeta Digital & Puntos</a>
          </center>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Paseo Aranjuez · Av. América Este & Pantaleón Dalence, Cochabamba, Bolivia.<br>
          Este correo fue generado automáticamente por la plataforma web.
        </div>
      </div>
    </body>
    </html>
    `;

    return await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: `🎉 ¡Bienvenido al Club Paseo Aranjuez, ${name}! Tienes +${points} puntos de regalo`,
      html,
    });
  } catch (error: unknown) {
    console.error('[Email Welcome Error]:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// 2. Notificación de Pedido al Cliente
export async function sendPaseoOrderCustomerEmail(opts: {
  to: string;
  customerName: string;
  pickupCode: string;
  storeName: string;
  storeLocal?: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  total: number;
  pointsEarned: number;
}) {
  try {
    const transporter = getTransporter();
    const itemsHtml = opts.items
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
          <td style="padding: 10px 0; color: #FFFFFF;">${it.name}</td>
          <td style="padding: 10px; text-align: center; color: #CBD5E1;">${it.quantity}x</td>
          <td style="padding: 10px 0; text-align: right; color: #D4A24C; font-family: monospace;">Bs. ${(it.unitPrice * it.quantity).toFixed(2)}</td>
        </tr>
      `,
      )
      .join('');

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #030B1A; color: #FFFFFF; margin: 0; padding: 24px; }
        .container { max-width: 580px; margin: 0 auto; background: #061734; border: 1px solid rgba(255, 107, 26, 0.3); border-radius: 20px; overflow: hidden; }
        .header { background: #061734; padding: 28px 24px; text-align: center; border-bottom: 2px solid #FF6B1A; }
        .title { font-size: 22px; font-weight: 900; color: #FFFFFF; margin: 0; }
        .body { padding: 28px 24px; line-height: 1.6; color: #E2E8F0; }
        .code-box { background: rgba(6, 23, 52, 0.9); border: 2px dashed #FF6B1A; border-radius: 14px; padding: 18px; text-align: center; margin: 20px 0; }
        .code { font-size: 32px; font-weight: 900; color: #FF6B1A; letter-spacing: 4px; font-family: monospace; }
        .btn { display: inline-block; background: #FF6B1A; color: #FFFFFF !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; margin-top: 16px; }
        .footer { padding: 20px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid rgba(255, 255, 255, 0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">PASEO ARANJUEZ · PASEOYA</h1>
          <div style="font-size: 13px; color: #FF8F4D; font-weight: bold; margin-top: 4px;">Confirmación de Pedido / Reserva Click & Collect</div>
        </div>
        <div class="body">
          <p>Hola <strong>${opts.customerName}</strong>,</p>
          <p>Tu orden para <strong>${opts.storeName}</strong> (${opts.storeLocal || 'Local comercial'}) ha sido recibida y confirmada exitosamente.</p>

          <div class="code-box">
            <div style="font-size: 11px; color: #D4A24C; text-transform: uppercase; font-weight: bold;">Código de Retiro Presencial</div>
            <div class="code">${opts.pickupCode}</div>
            <div style="font-size: 12px; color: #CBD5E1; margin-top: 4px;">Presenta este código o tu QR en el local para recoger tu pedido.</div>
          </div>

          <h4 style="color: #D4A24C; margin-bottom: 8px;">Detalle del Pedido</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.2); color: #94A3B8; text-align: left;">
                <th style="padding-bottom: 6px;">Producto</th>
                <th style="padding-bottom: 6px; text-align: center;">Cant.</th>
                <th style="padding-bottom: 6px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.15); display: flex; justify-content: space-between; font-size: 16px;">
            <span style="font-weight: bold; color: #FFFFFF;">Total a Cancelar / Pagado:</span>
            <span style="font-weight: 900; color: #FF6B1A; font-family: monospace;">Bs. ${opts.total.toFixed(2)}</span>
          </div>

          <p style="font-size: 13px; color: #10B981; margin-top: 14px;">
            ✨ <strong>¡Sumaste +${opts.pointsEarned} Paseo Points!</strong> Se acreditarán al retirar tu pedido.
          </p>

          <center>
            <a href="${APP_URL}/cliente/pedidos" class="btn">Seguir Estado en Vivo</a>
          </center>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Paseo Aranjuez · Cochabamba, Bolivia.
        </div>
      </div>
    </body>
    </html>
    `;

    return await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: opts.to,
      subject: `🛍️ Pedido ${opts.pickupCode} Confirmado en ${opts.storeName} - Paseo Aranjuez`,
      html,
    });
  } catch (error: unknown) {
    console.error(
      '[Email Order Customer Error]:',
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

// 3. Notificación de Pedido Nuevo al Comercio / Vendedor
export async function sendPaseoOrderMerchantEmail(opts: {
  to: string;
  merchantName: string;
  storeName: string;
  storeLocal?: string;
  customerName: string;
  pickupCode: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  total: number;
}) {
  try {
    const transporter = getTransporter();
    const itemsHtml = opts.items
      .map(
        (it) => `
        <li style="margin-bottom: 6px; color: #E2E8F0;">
          <strong>${it.quantity}x</strong> ${it.name} — <span style="color: #D4A24C;">Bs. ${(it.unitPrice * it.quantity).toFixed(2)}</span>
        </li>
      `,
      )
      .join('');

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #030B1A; color: #FFFFFF; margin: 0; padding: 24px; }
        .container { max-width: 580px; margin: 0 auto; background: #061734; border: 1px solid rgba(72, 169, 166, 0.4); border-radius: 20px; overflow: hidden; }
        .header { background: #061734; padding: 28px 24px; text-align: center; border-bottom: 2px solid #48A9A6; }
        .title { font-size: 22px; font-weight: 900; color: #FFFFFF; margin: 0; }
        .body { padding: 28px 24px; line-height: 1.6; color: #E2E8F0; }
        .box { background: rgba(72, 169, 166, 0.1); border: 1px solid rgba(72, 169, 166, 0.3); border-radius: 14px; padding: 18px; margin: 18px 0; }
        .btn { display: inline-block; background: #48A9A6; color: #030B1A !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 900; font-size: 14px; margin-top: 16px; }
        .footer { padding: 20px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid rgba(255, 255, 255, 0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">PORTAL DE COMERCIO · PASEO ARANJUEZ</h1>
          <div style="font-size: 13px; color: #48A9A6; font-weight: bold; margin-top: 4px;">Alerta de Nuevo Pedido Click & Collect</div>
        </div>
        <div class="body">
          <p>Hola <strong>${opts.merchantName}</strong> (${opts.storeName}),</p>
          <p>El cliente <strong>${opts.customerName}</strong> acaba de realizar un nuevo pedido para retiro en tu establecimiento (<strong>${opts.storeLocal || 'Local'}</strong>):</p>

          <div class="box">
            <div style="font-size: 11px; color: #48A9A6; text-transform: uppercase; font-weight: bold;">Código de Retiro</div>
            <div style="font-size: 28px; font-weight: 900; color: #FFFFFF; font-family: monospace;">${opts.pickupCode}</div>
            <div style="font-size: 13px; margin-top: 6px; color: #CBD5E1;">Monto Total: <strong style="color: #FF6B1A;">Bs. ${opts.total.toFixed(2)}</strong></div>
          </div>

          <h4 style="color: #48A9A6; margin-bottom: 8px;">Artículos a Preparar:</h4>
          <ul style="padding-left: 20px;">
            ${itemsHtml}
          </ul>

          <p style="font-size: 13px; color: #CBD5E1;">
            Ingresa a tu terminal de comercio para validar el pedido y marcarlo como <strong>Listo para entrega</strong>.
          </p>

          <center>
            <a href="${APP_URL}/comercio/scanner" class="btn">Abrir Terminal de Scanner</a>
          </center>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Paseo Aranjuez · Portal de Establecimientos y Comercios.
        </div>
      </div>
    </body>
    </html>
    `;

    return await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: opts.to,
      subject: `🔔 [Nuevo Pedido ${opts.pickupCode}] Preparar para retiro en ${opts.storeName}`,
      html,
    });
  } catch (error: unknown) {
    console.error(
      '[Email Order Merchant Error]:',
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

// 4. Notificación de Cambio de Estado (ej: Pedido Listo)
export async function sendPaseoOrderStatusEmail(opts: {
  to: string;
  customerName: string;
  pickupCode: string;
  storeName: string;
  storeLocal?: string;
  newStatus: string;
}) {
  try {
    const transporter = getTransporter();
    const isReady = opts.newStatus === 'listo';
    const statusText = isReady ? 'LISTO PARA RECOGER' : opts.newStatus.toUpperCase();

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #030B1A; color: #FFFFFF; margin: 0; padding: 24px; }
        .container { max-width: 580px; margin: 0 auto; background: #061734; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 20px; overflow: hidden; }
        .header { background: #061734; padding: 28px 24px; text-align: center; border-bottom: 2px solid #10B981; }
        .body { padding: 28px 24px; line-height: 1.6; color: #E2E8F0; }
        .status-box { background: rgba(16, 185, 129, 0.1); border: 2px solid #10B981; border-radius: 14px; padding: 18px; text-align: center; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid rgba(255, 255, 255, 0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="font-size: 22px; font-weight: 900; color: #FFFFFF; margin: 0;">PASEO ARANJUEZ</h1>
          <div style="font-size: 13px; color: #10B981; font-weight: bold; margin-top: 4px;">Actualización de Estado de Pedido</div>
        </div>
        <div class="body">
          <p>Hola <strong>${opts.customerName}</strong>,</p>
          <p>Te informamos que tu pedido en <strong>${opts.storeName}</strong> ha cambiado de estado:</p>

          <div class="status-box">
            <div style="font-size: 12px; color: #10B981; font-weight: bold; text-transform: uppercase;">Estado Actual</div>
            <div style="font-size: 26px; font-weight: 900; color: #FFFFFF; margin: 4px 0;">${statusText}</div>
            <div style="font-size: 13px; color: #CBD5E1;">Código de retiro: <strong style="color: #FF6B1A; font-family: monospace;">${opts.pickupCode}</strong></div>
            <div style="font-size: 12px; color: #94A3B8; margin-top: 4px;">Ubicación: ${opts.storeLocal || 'Local del comercio'}</div>
          </div>

          <p>¡Pasa por el local cuando gustes y disfruta tu visita a Paseo Aranjuez!</p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Paseo Aranjuez · Cochabamba, Bolivia.
        </div>
      </div>
    </body>
    </html>
    `;

    return await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: opts.to,
      subject: `⚡ Tu pedido ${opts.pickupCode} en ${opts.storeName} está ${statusText} - Paseo Aranjuez`,
      html,
    });
  } catch (error: unknown) {
    console.error('[Email Status Error]:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Passwords never travel by email; only a short-lived, single-use link.
export async function sendPaseoPasswordRecoveryEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  try {
    return await getTransporter().sendMail({
      from: '"' + FROM_NAME + '" <' + FROM_EMAIL + '>',
      to: opts.to,
      subject: 'Restablecer tu contraseña de Paseo Aranjuez',
      text:
        'Abre este enlace para elegir una nueva contraseña. Expira en 30 minutos y solo puede utilizarse una vez.\n\n' +
        opts.resetUrl +
        '\n\nSi no solicitaste el cambio, ignora este mensaje. Tu contraseña actual sigue vigente.',
    });
  } catch {
    console.error('[Email] No se pudo enviar el enlace de recuperación.');
    return null;
  }
}

// 6. Notificación de cuenta promovida / habilitada como Comercio Oficial
export async function sendPaseoMerchantPromotedEmail(opts: {
  to: string;
  name: string;
  storeName?: string;
}) {
  try {
    const transporter = getTransporter();
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #030B1A; color: #FFFFFF; margin: 0; padding: 24px; }
        .container { max-width: 580px; margin: 0 auto; background: #061734; border: 1px solid rgba(255, 107, 26, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #061734 0%, #162447 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #FF6B1A; }
        .badge { display: inline-block; background: rgba(255, 107, 26, 0.2); border: 1px solid #FF6B1A; color: #FF6B1A; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
        .title { font-size: 24px; font-weight: 900; color: #FFFFFF; margin: 0; }
        .subtitle { font-size: 13px; color: #D4A24C; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; }
        .body { padding: 32px 24px; line-height: 1.6; color: #E2E8F0; }
        .features-box { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 20px; margin: 24px 0; }
        .feature-item { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
        .feature-item:last-child { margin-bottom: 0; }
        .feature-icon { background: rgba(255, 107, 26, 0.15); border: 1px solid rgba(255, 107, 26, 0.3); border-radius: 8px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; color: #FF6B1A; font-weight: bold; font-size: 14px; flex-shrink: 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #B84D0B 0%, #FF6B1A 100%); color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; margin-top: 16px; text-align: center; box-shadow: 0 8px 20px rgba(255, 107, 26, 0.3); }
        .footer { padding: 20px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid rgba(255, 255, 255, 0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">Cuenta de Negocio Activada</div>
          <h1 class="title">PASEO ARANJUEZ</h1>
          <div class="subtitle">Ecosistema Comercial & Empresarial</div>
        </div>
        <div class="body">
          <p>Estimado/a <strong>${opts.name}</strong>,</p>
          <p>Nos complace informarte que la Administración de <strong>Paseo Aranjuez</strong> ha habilitado tu cuenta con el rol de <strong>Dueño de Comercio Oficial</strong>.</p>
          
          <div class="features-box">
            <div style="font-size: 12px; color: #D4A24C; text-transform: uppercase; font-weight: bold; margin-bottom: 12px; letter-spacing: 1px;">Privilegios y Herramientas Habilitadas:</div>
            <div class="feature-item">
              <span class="feature-icon">🏪</span>
              <div><strong>Perfil de Establecimiento:</strong> Configura y actualiza el nombre de tu tienda, piso, sector, número de local, horarios y teléfono de contacto.</div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📦</span>
              <div><strong>Catálogo y Productos:</strong> Sube tus productos, fotos, precios en Bs. y controla el stock en tiempo real.</div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🏷️</span>
              <div><strong>Promociones y Descuentos:</strong> Crea ofertas especiales para los visitantes y miembros del Club Paseo.</div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📷</span>
              <div><strong>Caja & Validación (Scanner):</strong> Escanea los códigos QR de los clientes para aplicar descuentos, verificar compras de PaseoYa y canjes de puntos.</div>
            </div>
          </div>

          <p>El siguiente paso es completar la información de tu local para que los clientes puedan encontrarte fácilmente en el centro comercial:</p>

          <center>
            <a href="${APP_URL}/comercio/perfil" class="btn">Configurar Mi Establecimiento Ahora</a>
          </center>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Paseo Aranjuez • Av. América Este & Pantaleón Dalence, Cochabamba, Bolivia.<br>
          Si tienes alguna consulta, puedes contactar directamente al equipo administrativo.
        </div>
      </div>
    </body>
    </html>
    `;

    return await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: opts.to,
      subject: `🎉 ¡Felicidades! Tu cuenta fue habilitada como Comercio en Paseo Aranjuez`,
      html,
    });
  } catch (error: unknown) {
    console.error(
      '[Email Merchant Promoted Error]:',
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}
