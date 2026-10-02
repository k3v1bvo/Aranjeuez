import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/paseo/supabase'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

async function getContextData() {
  const [storesRes, productsRes, rewardsRes] = await Promise.all([
    supabaseAdmin.from('paseo_stores').select('id, name, description, category, floor, sector, local_num, schedule').eq('is_active', true),
    supabaseAdmin.from('paseo_products').select('id, name, description, price, category, stock, store:paseo_stores(name, floor, sector, local_num)').eq('is_active', true).gt('stock', 0),
    supabaseAdmin.from('paseo_rewards').select('name, description, points_cost, category').eq('is_active', true),
  ])

  return {
    stores: storesRes.data || [],
    products: productsRes.data || [],
    rewards: rewardsRes.data || [],
  }
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API key no configurada' }, { status: 500 })
  }

  const body = await req.json()
  const { messages } = body

  if (!messages?.length) {
    return NextResponse.json({ error: 'Mensajes requeridos' }, { status: 400 })
  }

  // Obtener contexto real del Paseo
  const context = await getContextData()

  const systemPrompt = `Eres Jarvis, el asistente inteligente oficial de Paseo Aranjuez. 
Eres amigable, preciso y proactivo. Hablas en español boliviano natural.
Tu objetivo es ayudar a visitantes y clientes a encontrar tiendas, productos, servicios y promociones dentro del Paseo.

DATOS REALES DE PASEO ARANJUEZ (usa SIEMPRE esta informacion, no inventes):

TIENDAS DISPONIBLES:
${JSON.stringify(context.stores, null, 2)}

PRODUCTOS DISPONIBLES (con stock):
${JSON.stringify(context.products.slice(0, 30), null, 2)}

PROGRAMA DE PUNTOS - PASEO POINTS:
Las compras generan puntos (Bs 1 = 1 punto).
Recompensas disponibles:
${JSON.stringify(context.rewards, null, 2)}

INSTRUCCIONES:
- Siempre menciona el piso, sector y numero de local cuando recomiendes una tienda
- Si alguien busca un producto, busca en las tiendas disponibles
- Si alguien dice "tengo hambre" sugiere opciones de gastronomia
- Si alguien dice "busco regalo" sugiere tiendas de regalos y productos relevantes
- Menciona que las compras generan Paseo Points
- Sé conciso pero util. Usa emojis con moderacion
- Si no tienes la informacion exacta, dilo honestamente
- Para hacer pedidos, sugiere ir a la seccion PaseoYa de la app`

  const geminiMessages = [
    {
      role: 'user',
      parts: [{ text: systemPrompt }]
    },
    {
      role: 'model',
      parts: [{ text: '¡Hola! Soy Jarvis, tu asistente de Paseo Aranjuez. ¿En qué puedo ayudarte hoy? 😊' }]
    },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
  ]

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    })
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: 'Error en Gemini API', detail: err }, { status: 500 })
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.'

  return NextResponse.json({ reply: text })
}
