-- ====================================================================
-- PASEO ARANJUEZ - SETUP MAESTRO COMPLETO (SQL EDITOR DE SUPABASE)
-- Copia y pega TODO este script en: Supabase > SQL Editor > New Query > RUN
-- ====================================================================

-- 1. TABLA: USUARIOS (CLIENTES, COMERCIOS, ADMIN)
CREATE TABLE IF NOT EXISTS paseo_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT,
  role        TEXT DEFAULT ''cliente'' CHECK (role IN (''cliente'',''comercio'',''admin'')),
  qr_token    TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  points      INT DEFAULT 0,
  level       TEXT DEFAULT ''bronce'' CHECK (level IN (''bronce'',''plata'',''oro'',''platino'')),
  birthday    DATE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: TIENDAS DE PASEO ARANJUEZ
CREATE TABLE IF NOT EXISTS paseo_stores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID REFERENCES paseo_users(id),
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,
  floor       TEXT,
  sector      TEXT,
  local_num   TEXT,
  schedule    TEXT,
  image_url   TEXT,
  phone       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: PRODUCTOS
CREATE TABLE IF NOT EXISTS paseo_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID REFERENCES paseo_stores(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  stock       INT DEFAULT 0,
  category    TEXT,
  image_url   TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: PEDIDOS (WEBSOCKETS REALTIME)
CREATE TABLE IF NOT EXISTS paseo_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES paseo_users(id),
  store_id      UUID REFERENCES paseo_stores(id),
  total         DECIMAL(10,2) NOT NULL,
  status        TEXT DEFAULT ''recibido''
                CHECK (status IN (''recibido'',''confirmado'',''preparando'',''listo'',''llego'',''entregado'',''cancelado'')),
  pickup_code   TEXT UNIQUE NOT NULL,
  qr_token      TEXT UNIQUE NOT NULL,
  points_earned INT DEFAULT 0,
  payment_method TEXT DEFAULT ''qr'',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: ITEMS DE PEDIDO
CREATE TABLE IF NOT EXISTS paseo_order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES paseo_orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES paseo_products(id),
  quantity    INT NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,
  subtotal    DECIMAL(10,2) NOT NULL
);

-- 6. TABLA: HISTORIAL DE PUNTOS
CREATE TABLE IF NOT EXISTS paseo_point_movements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES paseo_users(id),
  amount      INT NOT NULL,
  reason      TEXT NOT NULL,
  order_id    UUID REFERENCES paseo_orders(id),
  store_id    UUID REFERENCES paseo_stores(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: RECOMPENSAS DEL CLUB
CREATE TABLE IF NOT EXISTS paseo_rewards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  points_cost   INT NOT NULL,
  category      TEXT DEFAULT ''descuento'',
  is_active     BOOLEAN DEFAULT TRUE,
  stock         INT DEFAULT -1,
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA: CANJES DE CUPONES
CREATE TABLE IF NOT EXISTS paseo_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES paseo_users(id),
  reward_id   UUID REFERENCES paseo_rewards(id),
  coupon_code TEXT UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  qr_token    TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  status      TEXT DEFAULT ''activo'' CHECK (status IN (''activo'',''usado'',''expirado'')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA: PROMOCIONES
CREATE TABLE IF NOT EXISTS paseo_promotions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID REFERENCES paseo_stores(id),
  title       TEXT NOT NULL,
  description TEXT,
  discount    DECIMAL(5,2),
  start_date  DATE,
  end_date    DATE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLA: CARRITO
CREATE TABLE IF NOT EXISTS paseo_cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES paseo_users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES paseo_products(id) ON DELETE CASCADE,
  quantity    INT DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ====================================================================
-- HABILITAR WEBSOCKETS (SUPABASE REALTIME) & REPLICA IDENTITY
-- ====================================================================
ALTER TABLE paseo_orders REPLICA IDENTITY FULL;
ALTER TABLE paseo_point_movements REPLICA IDENTITY FULL;
ALTER TABLE paseo_products REPLICA IDENTITY FULL;
ALTER TABLE paseo_rewards REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE paseo_orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE paseo_point_movements;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE paseo_products;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE paseo_rewards;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ====================================================================
-- PERMISOS Y DESACTIVACION DE RLS (MANEJO MEDIANTE JWT PROPIO)
-- ====================================================================
ALTER TABLE paseo_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE paseo_stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE paseo_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE paseo_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE paseo_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE paseo_point_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE paseo_rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE paseo_redemptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE paseo_promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE paseo_cart_items DISABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ====================================================================
-- SEED DATA: TIENDAS, PRODUCTOS Y RECOMPENSAS REALES DE PASEO ARANJUEZ
-- ====================================================================

-- Administrador Demo (password: password)
INSERT INTO paseo_users (email, password, name, role) VALUES
(''admin@paseoaranjuez.bo'', ''$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe6Ue52W'', ''Admin Paseo'', ''admin'')
ON CONFLICT (email) DO NOTHING;

-- Tiendas oficiales
INSERT INTO paseo_stores (name, description, category, floor, sector, local_num, schedule, is_active) VALUES
(''TechZone Bolivia'', ''Tecnologia, accesorios gamer, smartwatches y gadgets'', ''tecnologia'', ''Piso 1'', ''Sector A'', ''Local 105'', ''Lun-Sab 9:00-20:00, Dom 10:00-18:00'', true),
(''Optica Vision'', ''Lentes de sol, monturas de marca y examenes de la vista'', ''salud'', ''Piso 1'', ''Sector B'', ''Local 112'', ''Lun-Sab 9:00-19:30'', true),
(''Moda Elite'', ''Ropa casual, vestidos, trajes y accesorios de temporada'', ''moda'', ''Piso 2'', ''Sector A'', ''Local 204'', ''Lun-Sab 9:00-20:00, Dom 10:00-18:00'', true),
(''Cafe Aranjuez'', ''Cafeteria de especialidad, pasteleria gourmet y almuerzos'', ''gastronomia'', ''Piso 1'', ''Sector C'', ''Local 118'', ''Lun-Dom 7:30-21:00'', true),
(''Mundo Regalo'', ''Regalos tematicos, perfumes, peluches y detalles especiales'', ''regalos'', ''Piso 2'', ''Sector B'', ''Local 211'', ''Lun-Sab 9:00-20:00'', true),
(''Libreria Central'', ''Best-sellers, literatura boliviana, arte y papeleria'', ''entretenimiento'', ''Piso 1'', ''Sector A'', ''Local 108'', ''Lun-Sab 8:30-20:00, Dom 10:00-17:00'', true)
ON CONFLICT DO NOTHING;

-- Recompensas del Club Paseo Points
INSERT INTO paseo_rewards (name, description, points_cost, category, stock) VALUES
(''Cupon 10% Descuento'', ''Aplica en cualquier tienda adherida de Paseo Aranjuez'', 250, ''descuento'', -1),
(''Cafe Americano Gratis'', ''Un cafe gratis a eleccion en Cafe Aranjuez'', 400, ''producto'', 100),
(''Cupon Bs 25 de Regalo'', ''Descuento de Bs 25 en compras mayores a Bs 100'', 800, ''descuento'', -1),
(''Descuento 20% en Moda Elite'', ''Valido en toda la coleccion de temporada'', 1200, ''exclusivo'', 40),
(''Auriculares In-Ear TechZone'', ''Auriculares estereo bluetooth en TechZone'', 2000, ''producto'', 25),
(''Pase VIP Estacionamiento Gratis'', ''1 semana de estacionamiento cubierto gratis en Paseo Aranjuez'', 3500, ''exclusivo'', 15)
ON CONFLICT DO NOTHING;

-- Verificar tablas
SELECT table_name FROM information_schema.tables WHERE table_schema = ''public'' AND table_name LIKE ''paseo_%'' ORDER BY table_name;