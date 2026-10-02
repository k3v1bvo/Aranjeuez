-- =============================================
-- MIGRACIÓN 07: Logística Táctica, Zonas de Envío y Portal de Repartidores (Drivers)
-- Redefinición del modelo de negocio a Admin (Dueño) + Repartidores + Clientes
-- =============================================

-- 1. Ampliación del ENUM order_status
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'preparing';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ready';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'picked_up';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'in_transit';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';

-- 2. Tabla de Zonas de Envío y Comisiones
CREATE TABLE IF NOT EXISTS shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                                     -- Ej. "Lima Metropolitana - Centro", "Cono Norte"
  department text,                                        -- Departamento / Región
  city text,                                              -- Ciudad / Distrito
  shipping_cost numeric(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),     -- Lo que paga el cliente
  driver_commission numeric(10,2) NOT NULL DEFAULT 0 CHECK (driver_commission >= 0), -- Comisión que gana el repartidor
  store_profit numeric(10,2) GENERATED ALWAYS AS (shipping_cost - driver_commission) STORED, -- Margen tienda
  estimated_hours int DEFAULT 24,                         -- Tiempo estimado de entrega en horas
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. Modificaciones a la tabla orders para tracking logístico completo
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_zone_id uuid REFERENCES shipping_zones(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost numeric(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_commission numeric(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'qr'; -- 'qr', 'cash_on_delivery', 'transfer'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;       -- WhatsApp para contacto directo
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address text;     -- Dirección completa de entrega
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_rating int CHECK (customer_rating >= 1 AND customer_rating <= 5);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_review text;

-- 4. Tabla de Ganancias y Liquidaciones de Repartidores
CREATE TABLE IF NOT EXISTS driver_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  zone_id uuid REFERENCES shipping_zones(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')), -- pending: por liquidar, paid: liquidado
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 5. Tabla de Disponibilidad y Ubicación Operativa del Repartidor
CREATE TABLE IF NOT EXISTS driver_availability (
  driver_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_available boolean NOT NULL DEFAULT true,
  current_zone_id uuid REFERENCES shipping_zones(id),
  updated_at timestamptz DEFAULT now()
);

-- 6. Tabla de Tracking en Tiempo Real (GPS opcional)
CREATE TABLE IF NOT EXISTS driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  lat numeric(10,7) NOT NULL,
  lng numeric(10,7) NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- 7. Historial de Transiciones de Estado del Pedido (Auditoría de Logística)
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  notes text,
  changed_at timestamptz DEFAULT now()
);

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_zone ON orders(shipping_zone_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver ON driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_status ON driver_earnings(status);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

-- =============================================
-- SEGURIDAD RLS (Row Level Security)
-- =============================================
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Politicas para shipping_zones: Lectura para todos los autenticados, Escritura solo admin
CREATE POLICY "Lectura pública/autenticada de zonas de envío"
  ON shipping_zones FOR SELECT
  USING (true);

CREATE POLICY "Admin gestiona zonas de envío"
  ON shipping_zones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para orders según roles:
-- Drop existing general read if needed or refine
DROP POLICY IF EXISTS "Repartidor ve pedidos listos o asignados" ON orders;
CREATE POLICY "Repartidor ve pedidos listos o asignados"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'vendor'
    )
    AND (
      status = 'ready' OR driver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Repartidor actualiza pedidos asignados" ON orders;
CREATE POLICY "Repartidor actualiza pedidos asignados"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'vendor'
    )
    AND (
      (status = 'ready' AND driver_id IS NULL) -- para tomar el pedido
      OR driver_id = auth.uid()                -- para avanzar estado
    )
  );

-- Políticas para driver_earnings:
CREATE POLICY "Repartidor ve sus propias comisiones"
  ON driver_earnings FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

CREATE POLICY "Admin gestiona todas las liquidaciones"
  ON driver_earnings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para driver_availability:
CREATE POLICY "Repartidor gestiona su propia disponibilidad"
  ON driver_availability FOR ALL
  TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Admin lee disponibilidad de repartidores"
  ON driver_availability FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- SEED DATA DE ZONAS DE ENVÍO
-- =============================================
INSERT INTO shipping_zones (name, department, city, shipping_cost, driver_commission, estimated_hours, is_active)
VALUES
  ('Lima Centro & Alrededores', 'Lima', 'Lima', 15.00, 10.00, 4, true),
  ('Lima Norte (Comas, Los Olivos, SMP)', 'Lima', 'Lima', 20.00, 15.00, 6, true),
  ('Lima Sur (Surco, Chorrillos, SJM)', 'Lima', 'Lima', 20.00, 15.00, 6, true),
  ('Callao & Zona Portuaria', 'Callao', 'Callao', 22.00, 16.00, 6, true),
  ('Provincias — Envío Táctico Courier', 'Nacional', 'Perú', 35.00, 25.00, 48, true)
ON CONFLICT DO NOTHING;
