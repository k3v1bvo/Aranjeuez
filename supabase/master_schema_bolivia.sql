-- =========================================================================================
-- TIENDA TÁCTICA BOLIVIA — MASTER DATABASE SCHEMA DEFINITIVO
-- Copia y pega este script completo en el SQL Editor de tu proyecto Supabase
-- Contiene: Tablas, Roles RBAC, RLS, Auditoría, Logística Bolivia (Bs.), Repartidores,
--           Notificaciones Bancarias Android, QRs Fijos y Verificación con IA Gemini
-- =========================================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS Y ENUMS
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'vendor', 'client');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending', 'paid', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. ROLES DE USUARIO
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'client',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 5. CATEGORÍAS DE PRODUCTO
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  parent_id text REFERENCES categories(id) ON DELETE SET NULL,
  position integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. PRODUCTOS TÁCTICOS (Imágenes guardadas como enlaces URL de ImgBB)
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric(10,2) NOT NULL,              -- Precio oficial de venta en Bolivianos (Bs.)
  cost_price numeric(10,2) DEFAULT 0,        -- Precio de compra al proveedor (SOLO ADMIN - privado)
  category_id text REFERENCES categories(id) ON DELETE SET NULL,
  images text[] DEFAULT '{}',                 -- Array de URLs de ImgBB (la imagen real se aloja en ImgBB)
  stock integer NOT NULL DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  sku text UNIQUE,
  is_active boolean DEFAULT true,
  vendor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. ZONAS DE ENVÍO (BOLIVIA - Tarifas en Bs. y Comisiones de Repartidores)
CREATE TABLE IF NOT EXISTS shipping_zones (
  id text PRIMARY KEY DEFAULT ('zone-' || substr(md5(random()::text), 1, 8)),
  name text NOT NULL,                         -- Ej: 'La Paz — Zona Sur (Calacoto, Achumani)'
  department text,                            -- 'La Paz', 'Santa Cruz', 'Cochabamba', etc.
  city text,
  shipping_cost numeric(10,2) NOT NULL,       -- Cobrado al cliente (Bs.)
  driver_commission numeric(10,2) NOT NULL,   -- Ganancia directa del chofer (Bs.)
  store_profit numeric(10,2) GENERATED ALWAYS AS (shipping_cost - driver_commission) STORED,
  estimated_hours integer DEFAULT 24,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 8. ÓRDENES / VENTAS (Adaptadas a Bolivia con 3 tipos de entrega y pagos 100% vs 50/50)
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',
  subtotal numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,               -- Monto total en Bolivianos (Bs.)
  
  -- Logística Bolivia (3 Modalidades)
  delivery_type text DEFAULT 'delivery',       -- 'pickup' (Almacén Central), 'delivery' (Moto Ciudad), 'national_shipping' (Flota)
  pickup_time text,                           -- Horario seleccionado para recojo en tienda
  pickup_location text,                       -- Dirección central del almacén
  destination_department text,                -- Destino para envíos por flota
  shipping_zone_id text REFERENCES shipping_zones(id) ON DELETE SET NULL,
  shipping_cost numeric(10,2) DEFAULT 0,
  
  -- Finanzas y Modalidad de Pago (100% vs 50/50 vs Contra Entrega)
  payment_mode text DEFAULT 'full_payment',    -- 'full_payment' (100% QR), 'partial_payment' (50/50), 'cash_on_delivery'
  payment_method text DEFAULT 'qr_simple',
  paid_amount numeric(10,2) DEFAULT 0,        -- Pagado anticipado por QR
  pending_amount numeric(10,2) DEFAULT 0,     -- Saldo a cobrar al entregar
  free_gift text,                             -- Regalo táctico sorpresa si pagó 100%
  voucher_url text,                           -- Comprobante alojado en ImgBB
  qr_code_data text,
  
  -- Repartidor Asignado y Tracking
  driver_id text,
  driver_commission numeric(10,2) DEFAULT 0,
  delivered_at timestamptz,
  delivery_notes text,
  
  -- Datos de Contacto del Receptor
  customer_name text,
  customer_phone text,                        -- Teléfono con WhatsApp (+591)
  customer_email text,
  customer_address text,
  internal_notes text,
  
  -- Calificación del Cliente
  customer_rating integer CHECK (customer_rating >= 1 AND customer_rating <= 5),
  customer_review text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. ITEMS DE LA ORDEN
CREATE TABLE IF NOT EXISTS order_items (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id text REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,          -- Precio unitario en Bs.
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 10. LIQUIDACIONES DE COMISIONES PARA REPARTIDORES
CREATE TABLE IF NOT EXISTS driver_earnings (
  id text PRIMARY KEY DEFAULT ('earn-' || substr(md5(random()::text), 1, 8)),
  driver_id text NOT NULL,
  order_id text REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,              -- Comisión ganada en Bs.
  zone_id text REFERENCES shipping_zones(id) ON DELETE SET NULL,
  status text DEFAULT 'pending',              -- 'pending', 'paid'
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 11. CONFIGURACIÓN DE LA TIENDA (Horarios, Dirección y Regalo Sorpresa)
CREATE TABLE IF NOT EXISTS store_settings (
  id text PRIMARY KEY DEFAULT 'main',
  store_name text DEFAULT 'Tienda Táctica Cochabamba',
  currency text DEFAULT 'BOB',
  currency_symbol text DEFAULT 'Bs.',
  pickup_address text DEFAULT 'Av. Heroínas #560 entre San Martín y 25 de Mayo, Zona Central, Cochabamba',
  pickup_schedule text DEFAULT 'Lunes a Sábado de 09:00 a 19:00 (Horario Continuo)',
  pickup_instructions text DEFAULT 'Presentar carnet de identidad o el código de tu orden al momento del recojo en nuestro almacén central de Cochabamba.',
  free_gift_name text DEFAULT 'Souvenir Táctico Sorpresa Oficial (Edición Especial)',
  free_gift_min_amount numeric(10,2) DEFAULT 0,
  is_gift_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- 12. NOTIFICACIONES BANCARIAS CAPTURADAS POR LA APP ANDROID
CREATE TABLE IF NOT EXISTS bank_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,                    -- 'BNB', 'BCP', 'Banco Unión', 'BMSC', etc.
  raw_text text NOT NULL,                     -- Texto completo de la notificación del celular
  amount numeric(10,2) NOT NULL,              -- Monto en Bs.
  sender_name text,                           -- Nombre del depositante si la notificación lo incluye
  transaction_ref text,                       -- Nro de transacción
  received_at timestamptz DEFAULT now(),
  status text DEFAULT 'unmatched',            -- 'unmatched', 'matched', 'flagged'
  matched_order_id text REFERENCES orders(id) ON DELETE SET NULL,
  confidence_score numeric(5,2) DEFAULT 0,
  device_id text,
  created_at timestamptz DEFAULT now()
);

-- 13. MATRIZ DE QRs PRE-GENERADOS POR MONTOS ESPECÍFICOS Y COMODÍN (ImgBB & Supabase)
CREATE TABLE IF NOT EXISTS fixed_amount_qrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric(10,2),                        -- Monto exacto en Bs. (null para QR comodín sin monto fijado)
  qr_image_url text NOT NULL,                 -- Imagen del QR alojada en ImgBB
  bank_name text DEFAULT 'Simple QR Bolivia', -- Banco (BCP, BNB, Banco Unión, GanaMóvil, etc.)
  account_name text,                          -- Titular de la cuenta receptora
  is_active boolean DEFAULT true,             -- Si el QR está activo para despachar al cliente
  is_default boolean DEFAULT false,           -- True si es el QR comodín de respaldo
  expiration_years text DEFAULT '3 años',     -- Vigencia del QR estático (ej. 3 años)
  notes text,                                 -- Notas internas de control
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 14. VERIFICACIONES DE PAGO CON INTELIGENCIA ARTIFICIAL (GEMINI OCR)
CREATE TABLE IF NOT EXISTS payment_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  voucher_url text NOT NULL,                  -- Comprobante del cliente en ImgBB
  gemini_extracted_data jsonb,                -- Datos leídos por Gemini Vision (monto, fecha, banco, ref)
  bank_notification_id uuid REFERENCES bank_notifications(id) ON DELETE SET NULL,
  match_status text DEFAULT 'pending',        -- 'matched_auto', 'discrepancy_amount', 'manual_approved'
  ai_analysis_notes text,
  verified_by text DEFAULT 'gemini_vision',
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 15. ALERTAS DEL SISTEMA (Stock crítico, verificación pendiente)
CREATE TABLE IF NOT EXISTS system_alerts (
  id text PRIMARY KEY DEFAULT ('alt-' || substr(md5(random()::text), 1, 8)),
  severity alert_severity NOT NULL,
  message text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 16. LOGS DE AUDITORÍA
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- =========================================================================================
-- SEMILLAS INICIALES (ZONAS DE BOLIVIA Y CONFIGURACIÓN)
-- =========================================================================================

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

INSERT INTO shipping_zones (id, name, department, city, shipping_cost, driver_commission, estimated_hours, is_active)
VALUES
  ('zone-01', 'Cochabamba — Centro / Casco Viejo / Las Cuadras / San Pedro (Delivery)', 'Cochabamba', 'Cochabamba', 12.00, 8.00, 2, true),
  ('zone-02', 'Cochabamba — Zona Norte (Cala Cala, Queru Queru, Av. América, Tupuraya)', 'Cochabamba', 'Cochabamba', 15.00, 10.00, 3, true),
  ('zone-03', 'Cochabamba — Zona Sur (Jaihuayco, Lacma, La Chimba, Albarrancho)', 'Cochabamba', 'Cochabamba', 15.00, 10.00, 3, true),
  ('zone-04', 'Cochabamba Metropolitana — Quillacollo y Colcapirhua (Delivery Express)', 'Cochabamba', 'Quillacollo', 20.00, 15.00, 4, true),
  ('zone-05', 'Cochabamba Metropolitana — Sacaba (Delivery Express)', 'Cochabamba', 'Sacaba', 20.00, 15.00, 4, true),
  ('zone-06', 'Cochabamba Metropolitana — Tiquipaya (Delivery Express)', 'Cochabamba', 'Tiquipaya', 18.00, 13.00, 4, true),
  ('zone-07', 'Envío Nacional Flota — Desde Terminal de Buses Cbba (La Paz, Santa Cruz, Oruro, Sucre, Tarija, Potosí, Beni, Pando)', 'Nacional', 'Terminal Cochabamba', 35.00, 25.00, 24, true),
  ('zone-08', 'Envío Nacional Courier — Shalom / Expreso a Domicilio desde Cochabamba', 'Nacional', 'Bolivia Courier', 40.00, 28.00, 48, true)
ON CONFLICT (id) DO NOTHING;

-- Categorías tácticas de ejemplo
INSERT INTO categories (id, name, slug, description, position, is_active)
VALUES
  ('cat-01', 'Chalecos Tácticos', 'chalecos-tacticos', 'Chalecos antibalas, porta-placas y plate carriers de grado militar', 1, true),
  ('cat-02', 'Calzado Táctico', 'calzado-tactico', 'Botas militares, de combate y operativas de alto rendimiento', 2, true),
  ('cat-03', 'Óptica & Linternas', 'optica-linternas', 'Miras holográficas, linternas tácticas y lentes balísticos UV400', 3, true),
  ('cat-04', 'Mochilas & Morrales', 'mochilas-morrales', 'Mochilas militares de asalto, morrales bandolera y pecheras tácticas MOLLE', 4, true),
  ('cat-05', 'Accesorios Tácticos', 'accesorios-tacticos', 'Guantes de combate, rodilleras, cascos FAST, fundas portapistolas y cinturones', 5, true),
  ('cat-06', 'Cuchillería Táctica', 'cuchilleria', 'Cuchillos de combate, navajas tácticas y herramientas de supervivencia militar', 6, true),
  ('cat-07', 'Relojes & Telecom', 'relojes-telecom', 'Relojes tácticos digitales impermeables, radios bidireccionales y comunicadores', 7, true),
  ('cat-08', 'Vestimenta Táctica', 'vestimenta-tactica', 'Pantalones cargo ripstop, poleras de combate (combat shirts) y uniformes militares', 8, true)
ON CONFLICT (id) DO NOTHING;

-- Productos tácticos iniciales con precio de costo y venta (Bs.)
INSERT INTO products (id, name, slug, description, cost_price, price, category_id, images, stock, low_stock_threshold, is_active)
VALUES
  ('prod-01', 'Plate Carrier Táctico Nivel IV Multicam', 'plate-carrier-tactico-nivel-iv-multicam', 'Chaleco porta-placas táctico de combate con sistema MOLLE integral de corte láser. Compatible con placas balísticas Stand-Alone NIJ IV.', 250.00, 340.00, 'cat-01', '{"https://images.unsplash.com/photo-1784612207661-f0deb9ce0223?w=800&auto=format&fit=crop&q=80"}', 14, 3, true),
  ('prod-02', 'Botas Tácticas Militares Desert Storm Vibram', 'botas-tacticas-militares-desert-storm-vibram', 'Botas de combate militar de 8 pulgadas con suela antideslizante tipo Vibram con autolimpieza. Membrana impermeable y transpirable.', 220.00, 310.00, 'cat-02', '{"https://images.unsplash.com/photo-1601175750527-88def4365509?w=800&auto=format&fit=crop&q=80"}', 20, 5, true),
  ('prod-03', 'Mira Holográfica Táctica EOTech XPS3', 'mira-holografica-tactica-eotech-xps3', 'Mira holográfica militar de punto rojo con retícula perimetral de 68 MOA y punto de 1 MOA. 10 niveles compatibles con visión nocturna NVG.', 280.00, 380.00, 'cat-03', '{"https://images.unsplash.com/photo-1784612212663-716f0518783d?w=800&auto=format&fit=crop&q=80"}', 8, 2, true),
  ('prod-04', 'Mochila Táctica Militar 45L MOLLE Assault Pack', 'mochila-tactica-militar-45l-molle-assault-pack', 'Mochila de asalto y patrulla táctica de 45 litros fabricada en nylon Cordura 1000D de alta tenacidad. Compartimento posterior para hidratación 3L.', 140.00, 220.00, 'cat-04', '{"https://images.unsplash.com/photo-1707264848832-a1de98edb85c?w=800&auto=format&fit=crop&q=80"}', 28, 5, true),
  ('prod-05', 'Guantes Tácticos de Combate con Nudillos de Carbono', 'guantes-tacticos-combate-nudillos-carbono', 'Guantes tácticos de intervención rápida con carcasa de fibra de carbono en nudillos. Palma acolchada antideslizante con refuerzo Kevlar y touch screen.', 65.00, 120.00, 'cat-05', '{"https://images.unsplash.com/photo-1566566716921-b50e82140547?w=800&auto=format&fit=crop&q=80"}', 45, 10, true),
  ('prod-06', 'Cuchillo Táctico Militar de Supervivencia KA-BAR', 'cuchillo-tactico-militar-supervivencia-kabar', 'Cuchillo de combate y supervivencia de hoja enteriza con acero al carbono 1095 Cro-Van de 7 pulgadas. Funda rígida Kydex táctica.', 85.00, 150.00, 'cat-06', '{"https://images.unsplash.com/photo-1773875342538-a45969eb78e5?w=800&auto=format&fit=crop&q=80"}', 18, 3, true),
  ('prod-07', 'Radio Táctico Baofeng UV-5R Militar VHF/UHF', 'radio-tactico-baofeng-uv5r-militar', 'Radio transceptor bidireccional dual-band VHF/UHF con 128 canales. Incluye auricular táctico acústico encubierto.', 90.00, 150.00, 'cat-07', '{"https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80"}', 35, 8, true),
  ('prod-08', 'Pantalón Cargo Táctico Ripstop Antidesgarro', 'pantalon-cargo-tactico-ripstop-antidesgarro', 'Pantalón operativo militar confeccionado en tela Ripstop antidesgarro con tratamiento hidrofóbico. 10 bolsillos organizadores y compartimento rodilleras.', 130.00, 200.00, 'cat-08', '{"https://images.unsplash.com/photo-1776687773939-348819a9b787?w=800&auto=format&fit=crop&q=80"}', 40, 8, true),
  ('prod-09', 'Polera Táctica Militar de Combate (Combat Shirt Ripstop)', 'polera-tactica-militar-combate-shirt', 'Camisa polera táctica de combate para uso bajo chalecos. Torso elástico de algodón transpirable y mangas ripstop con velcro para parches.', 85.00, 145.00, 'cat-08', '{"https://images.unsplash.com/photo-1764054059763-25078e72f049?w=800&auto=format&fit=crop&q=80"}', 38, 6, true),
  ('prod-10', 'Reloj Militar Táctico Digital G-Shock Impermeable 200M', 'reloj-militar-tactico-digital-g-shock-200m', 'Reloj militar blindado contra impactos severos y sumergible a 200 metros (20 BAR). Luz electroluminiscente nocturna y cristal mineral.', 110.00, 180.00, 'cat-07', '{"https://images.unsplash.com/photo-1576420469891-b303889e81bf?w=800&auto=format&fit=crop&q=80"}', 25, 5, true),
  ('prod-11', 'Lentes Balísticos Tácticos UV400 Antirreflejo (3 Cristales)', 'lentes-balisticos-tacticos-uv400-3-cristales', 'Gafas de tiro y patrulla táctica militar con certificación balística. Marco envolvente liviano con 3 micas intercambiables y estuche rígido.', 60.00, 115.00, 'cat-03', '{"https://images.unsplash.com/photo-1708799366365-a24608103bed?w=800&auto=format&fit=crop&q=80"}', 50, 10, true),
  ('prod-12', 'Morral Táctico Bandolera Cruzado MOLLE (Pechera Táctica)', 'morral-tactico-bandolera-cruzado-molle', 'Morral bandolera de asalto urbano y transporte táctico EDC. Correa acolchada ambidiestra, sistema MOLLE y bolsillo secreto para arma.', 70.00, 130.00, 'cat-04', '{"https://images.unsplash.com/photo-1673505379702-870e878f736a?w=800&auto=format&fit=crop&q=80"}', 35, 6, true),
  ('prod-13', 'Casco Táctico FAST Militar con Rieles y Montura NVG', 'casco-tactico-fast-militar-rieles-nvg', 'Casco táctico FAST PJ con rieles laterales ARC para accesorios y montura frontal para visores nocturnos NVG. Dial de ajuste occipital.', 170.00, 250.00, 'cat-05', '{"https://images.unsplash.com/photo-1788328358240-f3492c960317?w=800&auto=format&fit=crop&q=80"}', 15, 3, true),
  ('prod-14', 'Kit de Rodilleras y Coderas Tácticas de Alto Impacto', 'kit-rodilleras-coderas-tacticas-alto-impacto', 'Kit de protección militar articulada con carcasa de polímero TPU curvado, interior de espuma EVA y correas elásticas con velcro.', 55.00, 105.00, 'cat-05', '{"https://images.unsplash.com/photo-1788328395746-2334ab47609a?w=800&auto=format&fit=crop&q=80"}', 40, 8, true),
  ('prod-15', 'Funda Táctica Portapistola Universal (Holster) con Retención', 'funda-tactica-portapistola-holster-retencion', 'Funda pistolera táctica para cinto o chaleco MOLLE con retención activa por dedo índice. Compatible con Glock, Taurus, Bersa, CZ, Beretta.', 50.00, 100.00, 'cat-05', '{"https://images.unsplash.com/photo-1786427556258-d8f8d7f08e80?w=800&auto=format&fit=crop&q=80"}', 30, 6, true),
  ('prod-16', 'Chaleco Táctico Ligero MOLLE Modular con Porta-Cargadores', 'chaleco-tactico-ligero-molle-modular', 'Chaleco de intervención liviano en malla transpirable con triple pouch porta-cargador frontal y sistema MOLLE total.', 120.00, 190.00, 'cat-01', '{"https://images.unsplash.com/photo-1784612207661-f0deb9ce0223?w=800&auto=format&fit=crop&q=80"}', 25, 5, true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_amount_qrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para catálogo y zonas
CREATE POLICY "Lectura publica categorias" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Gestion admin categorias" ON categories FOR ALL USING (true);

CREATE POLICY "Lectura publica productos" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Gestion admin productos" ON products FOR ALL USING (true);

CREATE POLICY "Lectura publica zonas" ON shipping_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Gestion admin zonas" ON shipping_zones FOR ALL USING (true);

CREATE POLICY "Lectura publica ajustes tienda" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Gestion admin ajustes tienda" ON store_settings FOR ALL USING (true);

CREATE POLICY "Lectura publica QRs fijos" ON fixed_amount_qrs FOR SELECT USING (is_active = true);
CREATE POLICY "Gestion admin QRs fijos" ON fixed_amount_qrs FOR ALL USING (true);

CREATE POLICY "Insertar notificaciones desde app Android" ON bank_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura y gestion notificaciones bancarias" ON bank_notifications FOR ALL USING (true);

CREATE POLICY "Crear ordenes clientes y anonimos" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura general ordenes" ON orders FOR SELECT USING (true);
CREATE POLICY "Actualizar ordenes" ON orders FOR UPDATE USING (true);

CREATE POLICY "Insertar items orden" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura items orden" ON order_items FOR SELECT USING (true);

CREATE POLICY "Lectura y registro comprobantes" ON payment_verifications FOR ALL USING (true);

CREATE POLICY "Lectura publica perfiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Actualizar perfil propio" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Lectura roles usuario" ON user_roles FOR SELECT USING (true);
CREATE POLICY "Gestion admin roles" ON user_roles FOR ALL USING (true);

CREATE POLICY "Lectura comisiones repartidor" ON driver_earnings FOR SELECT USING (true);
CREATE POLICY "Gestion comisiones repartidor" ON driver_earnings FOR ALL USING (true);

-- Trigger para crear automáticamente el perfil al registrarse en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================================
-- 17. RENDICIÓN DE EFECTIVO (CASH SETTLEMENTS — CUADRE DE CAJA)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.cash_settlements (
  id text PRIMARY KEY,
  driver_id text NOT NULL,
  driver_name text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('qr_transfer', 'physical_delivery')),
  proof_image_url text,                              -- URL de ImgBB con foto del comprobante QR
  notes text,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  order_ids text[] NOT NULL DEFAULT '{}',             -- IDs de órdenes cubiertas
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_settlements_driver ON public.cash_settlements(driver_id);
CREATE INDEX IF NOT EXISTS idx_cash_settlements_status ON public.cash_settlements(status);
CREATE INDEX IF NOT EXISTS idx_cash_settlements_created ON public.cash_settlements(created_at DESC);

ALTER TABLE public.cash_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura general rendiciones" ON public.cash_settlements FOR SELECT USING (true);
CREATE POLICY "Insertar rendiciones repartidores" ON public.cash_settlements FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar rendiciones admin" ON public.cash_settlements FOR UPDATE USING (true);

-- =========================================================================================
-- 18. SUPABASE REALTIME (WEBSOCKETS)
-- Habilita la sincronización en vivo entre cliente, repartidor y administrador
-- =========================================================================================
ALTER TABLE public.cash_settlements REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_settlements;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
EXCEPTION WHEN duplicate_object THEN null; END $$;

