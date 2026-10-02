-- =============================================
-- MIGRACIÓN 01: Schema Inicial — Tienda Táctica
-- ENUMs, Tablas, Índices
-- =============================================

-- ============ ENUMS ============
CREATE TYPE app_role AS ENUM ('admin', 'vendor', 'client');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'failed');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

-- ============ PROFILES ============
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============ USER ROLES ============
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- ============ ROLE PERMISSIONS ============
CREATE TABLE role_permissions (
  role app_role NOT NULL,
  permission text NOT NULL,
  PRIMARY KEY (role, permission)
);

-- Seed permissions
INSERT INTO role_permissions (role, permission) VALUES
  -- Admin: full access
  ('admin', 'products.create'), ('admin', 'products.read'), ('admin', 'products.update'), ('admin', 'products.delete'),
  ('admin', 'orders.create'), ('admin', 'orders.read'), ('admin', 'orders.update'), ('admin', 'orders.delete'),
  ('admin', 'users.read'), ('admin', 'users.update'), ('admin', 'users.delete'),
  ('admin', 'payments.verify'), ('admin', 'payments.read'),
  ('admin', 'categories.create'), ('admin', 'categories.read'), ('admin', 'categories.update'), ('admin', 'categories.delete'),
  ('admin', 'reports.view'), ('admin', 'reports.export'),
  ('admin', 'audit.view'),
  ('admin', 'settings.edit'),
  ('admin', 'roles.manage'),
  -- Vendor: own products and orders
  ('vendor', 'products.create'), ('vendor', 'products.read'), ('vendor', 'products.update'), ('vendor', 'products.delete'),
  ('vendor', 'orders.read'),
  ('vendor', 'payments.verify'), ('vendor', 'payments.read'),
  ('vendor', 'categories.read'),
  ('vendor', 'reports.view'),
  -- Client: browse and buy
  ('client', 'products.read'),
  ('client', 'cart.create'), ('client', 'cart.read'), ('client', 'cart.update'), ('client', 'cart.delete'),
  ('client', 'orders.create'), ('client', 'orders.read'),
  ('client', 'payments.create'),
  ('client', 'categories.read');

-- ============ CATEGORIES ============
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  position int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============ PRODUCTS ============
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold int DEFAULT 5,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  images text[] DEFAULT '{}',
  vendor_id uuid NOT NULL REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz  -- soft delete
);

-- ============ CARTS ============
CREATE TABLE carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============ CART ITEMS ============
CREATE TABLE cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  added_at timestamptz DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

-- ============ ORDERS ============
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users,
  vendor_id uuid REFERENCES profiles(id),
  status order_status DEFAULT 'pending',
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  payment_method text DEFAULT 'qr',
  qr_code_data text,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  internal_notes text
);

-- ============ ORDER ITEMS ============
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0)
);

-- ============ PAYMENT VERIFICATIONS ============
CREATE TABLE payment_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  qr_session_id uuid DEFAULT gen_random_uuid(),
  device_id text,
  status payment_status DEFAULT 'pending',
  verified_at timestamptz,
  notification_sent_at timestamptz,
  notification_error text,
  verified_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

-- ============ PUSH TOKENS ============
CREATE TABLE push_tokens (
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  expo_push_token text NOT NULL,
  device_info text,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, expo_push_token)
);

-- ============ AUDIT LOGS ============
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  before jsonb,
  after jsonb,
  ip text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ============ SYSTEM ALERTS ============
CREATE TABLE system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  severity alert_severity DEFAULT 'info',
  message text NOT NULL,
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- ============ NOTIFICATIONS (in-app) ============
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text,
  read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

-- ============ ÍNDICES DE RENDIMIENTO ============
CREATE INDEX idx_products_vendor_active ON products(vendor_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_active ON products(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_payment_verifications_status ON payment_verifications(status);
CREATE INDEX idx_payment_verifications_order ON payment_verifications(order_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_system_alerts_resolved ON system_alerts(resolved, severity);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- ============ FUNCIONES HELPER ============

-- Auto-update updated_at on any table
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_carts_updated_at    BEFORE UPDATE ON carts    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create profile automatically on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
