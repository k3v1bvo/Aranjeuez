export type Role = 'cliente' | 'comercio' | 'empleado' | 'admin';
export type OrderStatus =
  'pendiente' | 'en_preparacion' | 'listo_para_recoger' | 'entregado' | 'cancelado';
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url?: string | null;
  role: Role;
  points: number;
  lifetime_points: number;
  qr_token: string;
  birthday: string | null;
  is_active: boolean;
  created_at: string;
}
export interface Store {
  id: string;
  owner_id: string | null;
  name: string;
  description: string;
  category: string;
  floor: string;
  sector: string;
  local_num: string;
  reference: string;
  schedule: string;
  phone: string;
  is_active: boolean;
  image_url: string | null;
}
export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  store?: Store;
}
export interface Reward {
  id: string;
  store_id: string | null;
  name: string;
  description: string;
  points_cost: number;
  stock: number;
  is_active: boolean;
  store?: Store;
}
export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name: string;
}
export interface Order {
  id: string;
  user_id: string;
  store_id: string;
  total: number;
  status: OrderStatus;
  pickup_code: string;
  qr_token: string;
  pickup_schedule: string;
  points_earned: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  store?: Store;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  items: OrderItem[];
}
export interface Movement {
  id: string;
  user_id: string;
  store_id: string | null;
  amount: number;
  reason: string;
  created_at: string;
  store?: Pick<Store, 'name'>;
  user?: Pick<User, 'name'>;
}
export interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  coupon_code: string;
  qr_token: string;
  status: 'activo' | 'usado' | 'expirado';
  created_at: string;
  expires_at: string | null;
  reward: Reward;
}
export interface Promotion {
  id: string;
  store_id: string | null;
  title: string;
  description: string;
  discount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  store?: Store;
}
export interface PaseoEvent {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  location: string;
  is_active: boolean;
}
export interface Category {
  id: string;
  name: string;
}
export interface Settings {
  points_ratio: number;
  welcome_points: number;
  paseo_name: string;
  location: string;
  geofence_radius?: number;
  geofence_lat?: number;
  geofence_lng?: number;
  geofence_strict?: boolean;
  demo_mode?: boolean;
  qr_welcome_points?: number;
  qr_entry_points?: number;
  qr_exit_points?: number;
  qr_min_minutes?: number;
}
export interface Catalog {
  stores: Store[];
  products: Product[];
  promotions: Promotion[];
  events: PaseoEvent[];
  categories: Category[];
  settings: Settings;
}
export interface CartItem {
  product: Product;
  quantity: number;
}
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  listo_para_recoger: 'Listo para recoger',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};
export const ORDER_STEPS: OrderStatus[] = [
  'pendiente',
  'en_preparacion',
  'listo_para_recoger',
  'entregado',
];
export function levelFor(points: number) {
  if (points >= 1000) return { name: 'Platino', min: 1000, next: null };
  if (points >= 500) return { name: 'Oro', min: 500, next: 1000 };
  if (points >= 200) return { name: 'Plata', min: 200, next: 500 };
  return { name: 'Bronce', min: 0, next: 200 };
}
export const money = (amount: number) =>
  new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(new Date(value));
export const homeFor = (role: Role) =>
  role === 'admin'
    ? '/admin/overview'
    : role === 'comercio' || role === 'empleado'
      ? '/comercio'
      : '/cliente';
