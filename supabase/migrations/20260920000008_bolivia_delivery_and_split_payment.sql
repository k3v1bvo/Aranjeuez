-- =============================================
-- MIGRACIÓN 08: Modalidades de Entrega para Bolivia, Pagos Divididos (50/50) y Regalo Táctico
-- Moneda Oficial: Bolivianos (Bs. / BOB)
-- =============================================

-- 1. Campos para las 3 modalidades de entrega y opciones de pago
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'delivery'; -- 'pickup', 'delivery', 'national_shipping'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'full_payment'; -- 'full_payment', 'partial_payment', 'cash_on_delivery'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_amount numeric(10,2) DEFAULT 0;       -- Monto pagado anticipadamente por QR
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pending_amount numeric(10,2) DEFAULT 0;    -- Saldo pendiente a cobrar en entrega
ALTER TABLE orders ADD COLUMN IF NOT EXISTS free_gift text;                           -- Souvenir táctico de regalo (100% pago)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time text;                         -- Horario elegido de recojo en tienda
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_location text;                     -- Dirección de retiro central
ALTER TABLE orders ADD COLUMN IF NOT EXISTS destination_department text;              -- Departamento de destino (Flota / Courier)

-- 2. Tabla de Configuración de Tienda y Horarios de Recojo
CREATE TABLE IF NOT EXISTS store_settings (
  id text PRIMARY KEY DEFAULT 'main',
  store_name text DEFAULT 'Tienda Táctica Bolivia',
  currency text DEFAULT 'BOB',
  currency_symbol text DEFAULT 'Bs.',
  pickup_address text DEFAULT 'Calle Murillo #840 esq. Sagárnaga, Zona Central, La Paz',
  pickup_schedule text DEFAULT 'Lunes a Sábado de 09:00 a 19:00 (Continuo)',
  pickup_instructions text DEFAULT 'Presentar carnet de identidad o el código de orden al recoger.',
  free_gift_name text DEFAULT 'Souvenir Táctico Sorpresa Oficial (Edición Especial)',
  free_gift_min_amount numeric(10,2) DEFAULT 0,
  is_gift_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Seed de configuración inicial
INSERT INTO store_settings (id, store_name, currency, currency_symbol, pickup_address, pickup_schedule, free_gift_name)
VALUES (
  'main',
  'Tienda Táctica Cochabamba',
  'BOB',
  'Bs.',
  'Av. Heroínas #560 entre San Martín y 25 de Mayo, Zona Central, Cochabamba',
  'Lunes a Sábado de 09:00 a 19:00 (Horario Continuo)',
  'Souvenir Táctico Sorpresa Oficial (Edición Especial)'
)
ON CONFLICT (id) DO UPDATE SET
  currency = EXCLUDED.currency,
  currency_symbol = EXCLUDED.currency_symbol,
  pickup_address = EXCLUDED.pickup_address,
  pickup_schedule = EXCLUDED.pickup_schedule;

-- 3. Zonas de Envío Adaptadas a Cochabamba y Bolivia (Bs.)
INSERT INTO shipping_zones (name, department, city, shipping_cost, driver_commission, estimated_hours, is_active)
VALUES
  ('Cochabamba — Centro / Casco Viejo / Las Cuadras / San Pedro (Delivery)', 'Cochabamba', 'Cochabamba', 12.00, 8.00, 2, true),
  ('Cochabamba — Zona Norte (Cala Cala, Queru Queru, Av. América, Tupuraya)', 'Cochabamba', 'Cochabamba', 15.00, 10.00, 3, true),
  ('Cochabamba — Zona Sur (Jaihuayco, Lacma, La Chimba, Albarrancho)', 'Cochabamba', 'Cochabamba', 15.00, 10.00, 3, true),
  ('Cochabamba Metropolitana — Quillacollo y Colcapirhua (Delivery Express)', 'Cochabamba', 'Quillacollo', 20.00, 15.00, 4, true),
  ('Cochabamba Metropolitana — Sacaba (Delivery Express)', 'Cochabamba', 'Sacaba', 20.00, 15.00, 4, true),
  ('Cochabamba Metropolitana — Tiquipaya (Delivery Express)', 'Cochabamba', 'Tiquipaya', 18.00, 13.00, 4, true),
  ('Envío Nacional Flota — Desde Terminal de Buses Cbba (La Paz, Santa Cruz, Oruro, Sucre, Tarija, Potosí, Beni, Pando)', 'Nacional', 'Terminal Cochabamba', 35.00, 25.00, 24, true),
  ('Envío Nacional Courier — Shalom / Expreso a Domicilio desde Cochabamba', 'Nacional', 'Bolivia Courier', 40.00, 28.00, 48, true)
ON CONFLICT DO NOTHING;
