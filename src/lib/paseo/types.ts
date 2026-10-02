// ============================================================
// PASEO ARANJUEZ — Tipos TypeScript
// ============================================================

export type UserRole = 'cliente' | 'comercio' | 'admin'
export type UserLevel = 'bronce' | 'plata' | 'oro' | 'platino'
export type OrderStatus = 'recibido' | 'confirmado' | 'preparando' | 'listo' | 'llego' | 'entregado' | 'cancelado'
export type RedemptionStatus = 'activo' | 'usado' | 'expirado'

export interface PaseoUser {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  qr_token: string
  points: number
  level: UserLevel
  birthday?: string
  avatar_url?: string
  created_at: string
}

export interface PaseoStore {
  id: string
  owner_id?: string
  name: string
  description?: string
  category: string
  floor?: string
  sector?: string
  local_num?: string
  schedule?: string
  image_url?: string
  phone?: string
  is_active: boolean
  created_at: string
}

export interface PaseoProduct {
  id: string
  store_id: string
  name: string
  description?: string
  price: number
  stock: number
  category?: string
  image_url?: string
  is_featured: boolean
  is_active: boolean
  created_at: string
  store?: PaseoStore
}

export interface PaseoOrder {
  id: string
  user_id: string
  store_id: string
  total: number
  status: OrderStatus
  pickup_code: string
  qr_token: string
  points_earned: number
  payment_method: string
  notes?: string
  created_at: string
  updated_at: string
  user?: PaseoUser
  store?: PaseoStore
  items?: PaseoOrderItem[]
}

export interface PaseoOrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  product?: PaseoProduct
}

export interface PaseoPointMovement {
  id: string
  user_id: string
  amount: number
  reason: string
  order_id?: string
  store_id?: string
  created_at: string
  store?: PaseoStore
  order?: PaseoOrder
}

export interface PaseoReward {
  id: string
  name: string
  description?: string
  points_cost: number
  category: string
  is_active: boolean
  stock: number
  image_url?: string
  created_at: string
}

export interface PaseoRedemption {
  id: string
  user_id: string
  reward_id: string
  coupon_code: string
  qr_token: string
  status: RedemptionStatus
  created_at: string
  reward?: PaseoReward
}

export interface PaseoPromotion {
  id: string
  store_id?: string
  title: string
  description?: string
  discount?: number
  start_date?: string
  end_date?: string
  is_active: boolean
  created_at: string
  store?: PaseoStore
}

export interface CartItem {
  product: PaseoProduct
  quantity: number
}

// Niveles y umbrales
export const LEVEL_THRESHOLDS = {
  bronce:   { min: 0,     max: 999,   label: 'Bronce',  color: '#CD7F32', next: 'plata' },
  plata:    { min: 1000,  max: 4999,  label: 'Plata',   color: '#C0C0C0', next: 'oro' },
  oro:      { min: 5000,  max: 14999, label: 'Oro',     color: '#FFD700', next: 'platino' },
  platino:  { min: 15000, max: Infinity, label: 'Platino', color: '#E5E4E2', next: null },
} as const

export function getLevelForPoints(points: number): UserLevel {
  if (points >= 15000) return 'platino'
  if (points >= 5000) return 'oro'
  if (points >= 1000) return 'plata'
  return 'bronce'
}

export function getNextLevelThreshold(level: UserLevel): number {
  const thresholds = { bronce: 1000, plata: 5000, oro: 15000, platino: 15000 }
  return thresholds[level]
}

export function getLevelProgress(points: number, level: UserLevel): number {
  const threshold = LEVEL_THRESHOLDS[level]
  if (level === 'platino') return 100
  const range = threshold.max - threshold.min
  const progress = points - threshold.min
  return Math.min(100, Math.round((progress / range) * 100))
}

// Categorias del marketplace
export const STORE_CATEGORIES = [
  { id: 'tecnologia',    label: 'Tecnología',    icon: '💻', color: '#3B82F6' },
  { id: 'moda',          label: 'Moda',          icon: '👗', color: '#EC4899' },
  { id: 'gastronomia',   label: 'Gastronomía',   icon: '🍽️', color: '#F59E0B' },
  { id: 'regalos',       label: 'Regalos',       icon: '🎁', color: '#8B5CF6' },
  { id: 'salud',         label: 'Salud',         icon: '💊', color: '#10B981' },
  { id: 'entretenimiento', label: 'Entretenimiento', icon: '📚', color: '#F97316' },
  { id: 'servicios',     label: 'Servicios',     icon: '🛎️', color: '#6366F1' },
  { id: 'hogar',         label: 'Hogar',         icon: '🏠', color: '#14B8A6' },
]

// Status labels en español
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  recibido:   'Pedido Recibido',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  listo:      'Listo para Recoger',
  llego:      'Cliente en el Paseo',
  entregado:  'Entregado',
  cancelado:  'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  recibido:   '#6366F1',
  confirmado: '#3B82F6',
  preparando: '#F59E0B',
  listo:      '#10B981',
  llego:      '#8B5CF6',
  entregado:  '#22C55E',
  cancelado:  '#EF4444',
}
