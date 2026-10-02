import { supabaseAdmin } from './supabase'
import { getLevelForPoints } from './types'

const POINTS_RATIO = parseInt(process.env.NEXT_PUBLIC_POINTS_RATIO || '1')

// Calcular puntos ganados por monto
export function calculatePoints(amount: number): number {
  return Math.floor(amount * POINTS_RATIO)
}

// Acreditar puntos al usuario y actualizar nivel
export async function awardPoints(
  userId: string,
  amount: number,
  reason: string,
  orderId?: string,
  storeId?: string
): Promise<{ newTotal: number; newLevel: string; error: string | null }> {
  // Obtener puntos actuales
  const { data: user, error: fetchErr } = await supabaseAdmin
    .from('paseo_users')
    .select('points')
    .eq('id', userId)
    .single()

  if (fetchErr || !user) return { newTotal: 0, newLevel: 'bronce', error: 'Usuario no encontrado' }

  const newTotal = user.points + amount
  const newLevel = getLevelForPoints(newTotal)

  // Actualizar usuario
  await supabaseAdmin
    .from('paseo_users')
    .update({ points: newTotal, level: newLevel })
    .eq('id', userId)

  // Registrar movimiento
  await supabaseAdmin
    .from('paseo_point_movements')
    .insert({
      user_id: userId,
      amount,
      reason,
      order_id: orderId || null,
      store_id: storeId || null,
    })

  return { newTotal, newLevel, error: null }
}

// Descontar puntos (canje)
export async function deductPoints(
  userId: string,
  amount: number,
  reason: string
): Promise<{ newTotal: number; error: string | null }> {
  const { data: user } = await supabaseAdmin
    .from('paseo_users')
    .select('points')
    .eq('id', userId)
    .single()

  if (!user) return { newTotal: 0, error: 'Usuario no encontrado' }
  if (user.points < amount) return { newTotal: user.points, error: 'Puntos insuficientes' }

  const newTotal = user.points - amount
  const newLevel = getLevelForPoints(newTotal)

  await supabaseAdmin
    .from('paseo_users')
    .update({ points: newTotal, level: newLevel })
    .eq('id', userId)

  await supabaseAdmin
    .from('paseo_point_movements')
    .insert({
      user_id: userId,
      amount: -amount,
      reason,
    })

  return { newTotal, error: null }
}

// Bonus por cumpleaños (doble puntos si es su dia)
export function getBirthdayMultiplier(birthday: string | null | undefined): number {
  if (!birthday) return 1
  const today = new Date()
  const bday = new Date(birthday)
  if (today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate()) return 2
  return 1
}

// Verificar si es primera compra (bonus 50 pts)
export async function checkFirstPurchaseBonus(userId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('paseo_orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'entregado')

  if ((count || 0) < 3) return 50
  return 0
}
