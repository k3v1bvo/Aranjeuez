// =============================================
// TypeScript Types for the Tactical Store
// =============================================

export type AppRole = 'admin' | 'vendor' | 'client';
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'verified' | 'failed';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type DeliveryType = 'pickup' | 'delivery' | 'national_shipping';
export type PaymentMode = 'full_payment' | 'partial_payment' | 'cash_on_delivery';

export interface ShippingZone {
  id: string;
  name: string;
  department: string | null;
  city: string | null;
  shipping_cost: number;
  driver_commission: number;
  store_profit: number;
  estimated_hours: number;
  is_active: boolean;
  created_at: string;
}

export interface DriverEarning {
  id: string;
  driver_id: string;
  order_id: string;
  amount: number;
  zone_id: string | null;
  status: 'pending' | 'paid';
  paid_at: string | null;
  created_at: string;
  zone?: ShippingZone;
  order?: Order;
}

export interface DriverAvailability {
  driver_id: string;
  is_available: boolean;
  current_zone_id: string | null;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
  changed_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  price: number;           // Precio de venta al público (Bs.)
  cost_price?: number;     // Precio de compra al proveedor — SOLO ADMIN (Bs.)
  stock: number;
  low_stock_threshold: number;
  category_id: string | null;
  images: string[];
  vendor_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Joined
  category?: Category;
  vendor?: Profile;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  added_at: string;
  // Joined
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  vendor_id?: string | null;
  driver_id?: string | null;
  shipping_zone_id?: string | null;
  shipping_cost: number;
  driver_commission: number;
  status: OrderStatus;
  total: number;
  paid_amount?: number;
  pending_amount?: number;
  payment_method: string;
  payment_mode?: PaymentMode;
  delivery_type?: DeliveryType;
  free_gift?: string | null;
  pickup_time?: string | null;
  pickup_location?: string | null;
  destination_department?: string | null;
  qr_code_data: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at?: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  internal_notes: string | null;
  customer_name?: string;
  customer_phone?: string; // WhatsApp
  customer_email?: string;
  customer_address?: string;
  delivery_notes?: string | null;
  customer_rating?: number | null;
  customer_review?: string | null;
  // Joined
  items?: OrderItem[];
  user?: Profile;
  vendor?: Profile;
  driver?: Profile;
  shipping_zone?: ShippingZone;
  customer?: { email?: string; name?: string; phone?: string; address?: string };
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  // Joined
  product?: Product;
}

export interface FixedAmountQR {
  id: string;
  amount: number | null;               // Monto exacto en Bs. (null o 0 si es QR comodín/sin monto fijo)
  qr_image_url: string;                // Link directo de la imagen en ImgBB
  bank_name: string;                   // Ej: 'Banco Unión', 'BCP', 'BNB', 'Simple QR Bolivia', 'Yape'
  account_name?: string | null;        // Nombre del titular de la cuenta
  is_active: boolean;                  // Habilitado para servir en checkout
  is_default: boolean;                 // true si es el QR comodín de respaldo cuando el monto no coincide
  expiration_years?: string;           // Ej: '3 años', '5 años', 'Sin expiración'
  expiration_date?: string | null;     // Fecha exacta de vencimiento bancario ISO 'YYYY-MM-DD'
  notes?: string | null;               // Notas internas
  created_at: string;
  updated_at?: string;
}

export type ActivePaymentProvider = 'yape' | 'bmsc' | 'bnb' | 'union' | 'bisa' | 'crypto';

export interface PaymentGatewaySettings {
  active_provider: ActivePaymentProvider;
  provider_name: string;              // Ej: "Yape Bolivia / BCP Soli"
  package_name: string;               // Ej: "com.bcp.bo.wallet"
  account_holder: string;             // Ej: "Tienda Táctica Bolivia SRL"
  phone_or_account: string;           // Ej: "78353814" o cuenta bancaria
  checkout_title: string;             // Ej: "Pago Rápido con Yape Bolivia (Simple QR)"
  checkout_instructions: string;      // Instrucciones visibles en checkout
  auto_match_enabled: boolean;        // Conciliación en tiempo real con Supabase
  notify_on_verified: boolean;        // Notificar al cliente al confirmar
  updated_at: string;
}

export interface PaymentVerification {
  id: string;
  order_id: string;
  qr_session_id: string;
  device_id: string | null;
  status: PaymentStatus;
  verified_at: string | null;
  notification_sent_at: string | null;
  notification_error: string | null;
  verified_by: string | null;
  created_at: string;
  // Joined
  order?: Order;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined
  user?: Profile;
}

export interface SystemAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  resolved: boolean;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string | null;
  read: boolean;
  link: string | null;
  created_at: string;
}

// Dashboard metrics
export interface DailySalesSummary {
  date: string;
  total_sales: number;
  order_count: number;
  avg_ticket: number;
  unique_customers: number;
}

export interface ProductSalesSummary {
  product_id: string;
  product_name: string;
  category_id: string;
  total_sold: number;
  total_revenue: number;
  order_count: number;
}

export interface VendorSalesSummary {
  vendor_id: string;
  vendor_name: string;
  total_sales: number;
  order_count: number;
  avg_ticket: number;
}

export interface CategorySalesSummary {
  category_id: string;
  category_name: string;
  total_sales: number;
  order_count: number;
}

// Cash settlement (driver returns collected cash to store)
export type CashSettlementStatus = 'pending_review' | 'approved' | 'rejected';
export type CashSettlementMethod = 'qr_transfer' | 'physical_delivery';

export interface CashSettlement {
  id: string;
  driver_id: string;
  driver_name: string;
  amount: number;
  method: CashSettlementMethod;
  proof_image_url?: string | null; // QR transfer receipt screenshot
  notes?: string | null;
  status: CashSettlementStatus;
  order_ids: string[]; // orders covered by this settlement
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}
