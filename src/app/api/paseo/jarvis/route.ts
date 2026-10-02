import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/paseo/supabase"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

async function getContextData() {
  const db = getDB()
  const [storesRes, productsRes, rewardsRes] = await Promise.all([
    db.from("paseo_stores").select("id,name,description,category,floor,sector,local_num,schedule").eq("is_active", true),
    db.from("paseo_products").select("id,name,description,price,category,stock,store:paseo_stores(name,floor,sector,local_num)").eq("is_active", true).gt("stock", 0),
    db.from("paseo_rewards").select("name,description,points_cost,category").eq("is_active", true),
  ])
  return { stores: storesRes.data || [], products: productsRes.data || [], rewards: rewardsRes.data || [] }
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) return NextResponse.json({ error: "Gemini API key no configurada" }, { status: 500 })
  const { messages } = await req.json()
  if (!messages?.length) return NextResponse.json({ error: "Mensajes requeridos" }, { status: 400 })
  const context = await getContextData()
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`
  const systemPrompt = `Eres Jarvis, el asistente inteligente oficial de Paseo Aranjuez. Eres amigable y preciso. Hablas en español boliviano natural.
TIENDAS: ${JSON.stringify(context.stores)}
PRODUCTOS (con stock): ${JSON.stringify(context.products.slice(0, 20))}
RECOMPENSAS: ${JSON.stringify(context.rewards)}
Siempre menciona piso, sector y local. Menciona que las compras generan Paseo Points (Bs 1 = 1 punto). Sé conciso.`
  const geminiMessages = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "¡Hola! Soy Jarvis, tu asistente de Paseo Aranjuez. ¿En qué puedo ayudarte? 😊" }] },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }))
  ]
  const response = await fetch(GEMINI_URL, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: geminiMessages, generationConfig: { temperature: 0.7, maxOutputTokens: 500 } })
  })
  if (!response.ok) return NextResponse.json({ error: "Error en Gemini" }, { status: 500 })
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar respuesta."
  return NextResponse.json({ reply: text })
}
