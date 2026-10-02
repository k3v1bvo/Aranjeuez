import { NextRequest, NextResponse } from 'next/server';

function getEnv(key: string): string {
  if (process.env[key]) return process.env[key] as string;
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const [k, ...v] = trimmed.split('=');
        if (k.trim() === key) {
          return v.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch {}
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiptUrl } = body;

    if (!receiptUrl) {
      return NextResponse.json(
        { success: false, error: 'Se requiere la URL del comprobante de transferencia' },
        { status: 400 }
      );
    }

    const apiKey = getEnv('GEMINI_API_KEY');
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY no configurada' },
        { status: 500 }
      );
    }

    // 1. Descargar la imagen del comprobante (ImgBB) y convertirla a Base64
    const imgResponse = await fetch(receiptUrl);
    if (!imgResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'No se pudo descargar la imagen del comprobante desde ImgBB' },
        { status: 400 }
      );
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';

    // 2. Consultar a Gemini Vision (3.5 / 3.8 / latest)
    const prompt = `Eres un auditor bancario en Bolivia especializado en comprobantes de Yape, BCP, Banco Unión, Banco Nacional de Bolivia (BNB) y Banco Mercantil Santa Cruz (BMSC).
Analiza detalladamente esta captura de comprobante bancario y extrae estrictamente un objeto JSON válido con este formato:
{
  "isValidReceipt": boolean,
  "amount": number | null,
  "currency": "BOB" | "USD" | null,
  "senderName": string | null,
  "recipientName": string | null,
  "transactionRef": string | null,
  "bankName": string | null,
  "timestamp": string | null,
  "notes": string | null
}
Reglas críticas:
- Si el monto dice "Bs. 150.00" o "BOL 150", amount debe ser 150.0.
- Extrae el nombre exacto de la persona que envió el dinero (emisor/origen), sin abreviaciones.
- Si ves un N° de Transacción u Operación (ej. 971669553), colócalo en transactionRef.
- Responde ÚNICAMENTE con el objeto JSON plano, sin backticks ni markdown de ningún tipo.`;

    const models = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let geminiResultText = '';

    for (const model of models) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          geminiResultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (geminiResultText) break;
        }
      } catch (e) {
        console.warn(`Fallo con modelo ${model}, intentando siguiente...`);
      }
    }

    if (!geminiResultText) {
      return NextResponse.json(
        { success: false, error: 'El motor de IA no pudo procesar la imagen del comprobante' },
        { status: 502 }
      );
    }

    // Limpiar posibles etiquetas markdown
    const cleanJson = geminiResultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);

    // 3. Cruzar con la Base de Datos de Notificaciones Móviles de Supabase
    let matchedNotification: any = null;
    const notifBaseUrl = (
      getEnv('NEXT_PUBLIC_NOTIFICATIONS_SUPABASE_URL') || 'https://kbybohnmvaayifpzybvs.supabase.co'
    ).replace(/\/$/, '');
    const notifAnonKey =
      getEnv('NEXT_PUBLIC_NOTIFICATIONS_SUPABASE_ANON_KEY') ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieWJvaG5tdmFheWlmcHp5YnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjkwMjMsImV4cCI6MjEwMzg0NTAyM30.Jp9uAneVkaWEoz6OjTKVvTEAFVm3iz5Xws3SiCwAVlg';

    if (parsedData.amount) {
      try {
        const notifRes = await fetch(
          `${notifBaseUrl}/rest/v1/notifications?order=id.desc&limit=25`,
          {
            headers: {
              apikey: notifAnonKey,
              Authorization: `Bearer ${notifAnonKey}`,
            },
          }
        );

        if (notifRes.ok) {
          const liveNotifs = await notifRes.json();
          const senderWords = (parsedData.senderName || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .split(/\s+/)
            .filter((w: string) => w.length > 2);

          for (const n of liveNotifs) {
            const content = (n.content || '').toUpperCase();
            const title = (n.title || '').toUpperCase();
            const text = `${title} ${content}`;

            const amountStr = parsedData.amount.toString();
            const hasAmount = text.includes(amountStr) || text.includes(parsedData.amount.toFixed(2));
            const hasSenderMatch = senderWords.some((w: string) => text.includes(w));
            const hasRefMatch = parsedData.transactionRef && text.includes(parsedData.transactionRef);

            if (hasAmount && (hasSenderMatch || hasRefMatch)) {
              matchedNotification = {
                id: n.id,
                bank: n.app_name || n.package_name,
                content: n.content,
                createdAt: n.created_at,
              };
              break;
            }
          }
        }
      } catch (err) {
        console.warn('Error al consultar notificaciones en Supabase:', err);
      }
    }

    return NextResponse.json({
      success: true,
      extracted: parsedData,
      isReconciled: !!matchedNotification,
      matchedNotification,
      message: matchedNotification
        ? `¡Pago conciliado al 100%! La IA detectó al emisor "${parsedData.senderName}" por Bs. ${parsedData.amount?.toFixed(2)} y coincidió con la notificación bancaria.`
        : `Comprobante analizado con éxito por IA. Emisor detectado: ${parsedData.senderName || 'No visible'} (Bs. ${parsedData.amount?.toFixed(2) || '0.00'}).`,
    });
  } catch (error: any) {
    console.error('Error en verify-receipt:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar el comprobante' },
      { status: 500 }
    );
  }
}
