import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/paseo/supabase"
import { getUserFromToken } from "@/lib/paseo/auth"
import { generatePickupCode, generateQRToken } from "@/lib/paseo/qr"
import { calculatePoints, awardPoints, checkFirstPurchaseBonus, getBirthdayMultiplier } from "@/lib/paseo/points"

export async function GET(req: NextRequest) {
  const token = req.cookies.get("paseo_token")?.value
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const db = getDB()
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("storeId")
  let query = db
    .from("paseo_orders")
    .select("*, store:paseo_stores(id,name,floor,sector,local_num,image_url), user:paseo_users(id,name,email,phone), items:paseo_order_items(*,product:paseo_products(id,name,image_url,price))")
    .order("created_at", { ascending: false })
  if (user.role === "cliente") query = query.eq("user_id", user.id)
  else if (user.role === "comercio" && storeId) query = query.eq("store_id", storeId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("paseo_token")?.value
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const db = getDB()
  const body = await req.json()
  const { storeId, items, paymentMethod = "qr", notes } = body
  if (!storeId || !items?.length) return NextResponse.json({ error: "Tienda e items requeridos" }, { status: 400 })
  let total = 0
  for (const item of items) {
    const { data: product } = await db.from("paseo_products").select("price,stock").eq("id", item.productId).single()
    if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 400 })
    if (product.stock < item.quantity) return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 })
    total += product.price * item.quantity
  }
  const multiplier = getBirthdayMultiplier(user.birthday)
  const pointsEarned = Math.floor(calculatePoints(total) * multiplier)
  const pickupCode = generatePickupCode()
  const qrToken = generateQRToken()
  const { data: order, error: orderErr } = await db
    .from("paseo_orders")
    .insert({ user_id: user.id, store_id: storeId, total, pickup_code: pickupCode, qr_token: qrToken, points_earned: pointsEarned, payment_method: paymentMethod, notes })
    .select().single()
  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })
  for (const item of items) {
    const { data: product } = await db.from("paseo_products").select("price").eq("id", item.productId).single()
    await db.from("paseo_order_items").insert({ order_id: order.id, product_id: item.productId, quantity: item.quantity, unit_price: product!.price, subtotal: product!.price * item.quantity })
    await db.from("paseo_products").update({ stock: product!.price - item.quantity }).eq("id", item.productId)
  }
  return NextResponse.json({ order, success: true }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("paseo_token")?.value
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const db = getDB()
  const body = await req.json()
  const { orderId, status } = body
  const validTransitions: Record<string, string[]> = {
    comercio: ["confirmado","preparando","listo","entregado","cancelado"],
    admin:    ["recibido","confirmado","preparando","listo","llego","entregado","cancelado"],
    cliente:  ["llego"],
  }
  if (!validTransitions[user.role]?.includes(status)) return NextResponse.json({ error: "Transición no permitida" }, { status: 403 })
  const { data: order, error } = await db.from("paseo_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (status === "entregado") {
    const bonus = await checkFirstPurchaseBonus(order.user_id)
    await awardPoints(order.user_id, order.points_earned + bonus, `Compra${bonus > 0 ? " + bonus" : ""}`, order.id, order.store_id)
  }
  return NextResponse.json({ order, success: true })
}
