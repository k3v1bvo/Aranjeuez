import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/paseo/supabase'
import { parseQRContent } from '@/lib/paseo/qr'

// POST /api/paseo/scanner — validar QR escaneado
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { qrRaw, pin, type } = body

  const parsed = parseQRContent(qrRaw)

  // QR de pedido
  if (parsed.type === 'order' && type === 'order') {
    const { data: order } = await supabaseAdmin
      .from('paseo_orders')
      .select('*, user:paseo_users(name, email, phone), items:paseo_order_items(*, product:paseo_products(name))')
      .eq('qr_token', parsed.qrToken)
      .single()

    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    if (order.status === 'entregado') return NextResponse.json({ error: 'Este pedido ya fue entregado' }, { status: 400 })
    if (order.status === 'cancelado') return NextResponse.json({ error: 'Este pedido fue cancelado' }, { status: 400 })

    // Validar PIN
    if (pin && order.pickup_code !== pin) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 400 })
    }

    return NextResponse.json({ valid: true, order, type: 'order' })
  }

  // QR personal del cliente (para acreditar puntos presenciales)
  if (parsed.type === 'user' && type === 'user') {
    const { data: user } = await supabaseAdmin
      .from('paseo_users')
      .select('id, name, email, points, level, qr_token')
      .eq('qr_token', parsed.qrToken)
      .single()

    if (!user) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

    return NextResponse.json({ valid: true, user, type: 'user' })
  }

  // QR de cupon
  if (parsed.type === 'coupon' && type === 'coupon') {
    const { data: redemption } = await supabaseAdmin
      .from('paseo_redemptions')
      .select('*, reward:paseo_rewards(*), user:paseo_users(name, email)')
      .eq('qr_token', parsed.qrToken)
      .single()

    if (!redemption) return NextResponse.json({ error: 'Cupón no encontrado' }, { status: 404 })
    if (redemption.status !== 'activo') return NextResponse.json({ error: `Cupón ${redemption.status}` }, { status: 400 })

    // Marcar como usado
    await supabaseAdmin
      .from('paseo_redemptions')
      .update({ status: 'usado' })
      .eq('id', redemption.id)

    return NextResponse.json({ valid: true, redemption, type: 'coupon' })
  }

  return NextResponse.json({ error: 'QR no reconocido' }, { status: 400 })
}
