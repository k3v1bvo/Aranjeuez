import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/paseo/supabase'
import { getUserFromToken } from '@/lib/paseo/auth'
import { deductPoints } from '@/lib/paseo/points'
import { generateQRToken } from '@/lib/paseo/qr'

// GET /api/paseo/puntos — movimientos del usuario
export async function GET(req: NextRequest) {
  const token = req.cookies.get('paseo_token')?.value
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: movements } = await supabaseAdmin
    .from('paseo_point_movements')
    .select('*, store:paseo_stores(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: rewards } = await supabaseAdmin
    .from('paseo_rewards')
    .select('*')
    .eq('is_active', true)
    .order('points_cost')

  const { data: redemptions } = await supabaseAdmin
    .from('paseo_redemptions')
    .select('*, reward:paseo_rewards(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ movements, rewards, redemptions, points: user.points, level: user.level })
}

// POST /api/paseo/puntos — canjear recompensa
export async function POST(req: NextRequest) {
  const token = req.cookies.get('paseo_token')?.value
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await getUserFromToken(token)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { rewardId } = body

  const { data: reward } = await supabaseAdmin
    .from('paseo_rewards')
    .select('*')
    .eq('id', rewardId)
    .eq('is_active', true)
    .single()

  if (!reward) return NextResponse.json({ error: 'Recompensa no disponible' }, { status: 404 })
  if (user.points < reward.points_cost) return NextResponse.json({ error: 'Puntos insuficientes' }, { status: 400 })
  if (reward.stock === 0) return NextResponse.json({ error: 'Sin stock disponible' }, { status: 400 })

  // Descontar puntos
  const { error: pointsErr } = await deductPoints(user.id, reward.points_cost, `Canje: ${reward.name}`)
  if (pointsErr) return NextResponse.json({ error: pointsErr }, { status: 400 })

  // Actualizar stock si aplica
  if (reward.stock > 0) {
    await supabaseAdmin
      .from('paseo_rewards')
      .update({ stock: reward.stock - 1 })
      .eq('id', rewardId)
  }

  // Crear canje con QR
  const qrToken = generateQRToken()
  const { data: redemption } = await supabaseAdmin
    .from('paseo_redemptions')
    .insert({ user_id: user.id, reward_id: rewardId, qr_token: qrToken })
    .select('*, reward:paseo_rewards(*)')
    .single()

  return NextResponse.json({ redemption, success: true }, { status: 201 })
}
