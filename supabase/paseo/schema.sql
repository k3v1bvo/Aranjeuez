-- ============================================================
-- PASEO ARANJUEZ — Schema completo de base de datos
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- USUARIOS
CREATE TABLE IF NOT EXISTS paseo_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT,
  role        TEXT DEFAULT 'cliente' CHECK (role IN ('cliente','comercio','admin')),
  qr_token    TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  points      INT DEFAULT 0,
  level       TEXT DEFAULT 'bronce' CHECK (level IN ('bronce','plata','oro','platino')),
  birthday    DATE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TIENDAS
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

-- PRODUCTOS
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

-- PEDIDOS
CREATE TABLE IF NOT EXISTS paseo_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES paseo_users(id),
  store_id      UUID REFERENCES paseo_stores(id),
  total         DECIMAL(10,2) NOT NULL,
  status        TEXT DEFAULT 'recibido'
                CHECK (status IN ('recibido','confirmado','preparando','listo','llego','entregado','cancelado')),
  pickup_code   TEXT UNIQUE NOT NULL,
  qr_token      TEXT UNIQUE NOT NULL,
  points_earned INT DEFAULT 0,
  payment_method TEXT DEFAULT 'qr',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ITEMS DEL PEDIDO
CREATE TABLE IF NOT EXISTS paseo_order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES paseo_orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES paseo_products(id),
  quantity    INT NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,
  subtotal    DECIMAL(10,2) NOT NULL
);

-- MOVIMIENTOS DE PUNTOS
CREATE TABLE IF NOT EXISTS paseo_point_movements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES paseo_users(id),
  amount      INT NOT NULL,
  reason      TEXT NOT NULL,
  order_id    UUID REFERENCES paseo_orders(id),
  store_id    UUID REFERENCES paseo_stores(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RECOMPENSAS
CREATE TABLE IF NOT EXISTS paseo_rewards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  points_cost   INT NOT NULL,
  category      TEXT DEFAULT 'descuento',
  is_active     BOOLEAN DEFAULT TRUE,
  stock         INT DEFAULT -1,
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- CANJES
CREATE TABLE IF NOT EXISTS paseo_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES paseo_users(id),
  reward_id   UUID REFERENCES paseo_rewards(id),
  coupon_code TEXT UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  qr_token    TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  status      TEXT DEFAULT 'activo' CHECK (status IN ('activo','usado','expirado')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- PROMOCIONES
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

-- CARRITO (sesion temporal)
CREATE TABLE IF NOT EXISTS paseo_cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES paseo_users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES paseo_products(id) ON DELETE CASCADE,
  quantity    INT DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- SEED DATA — Datos iniciales de Paseo Aranjuez
-- ============================================================

-- Admin
INSERT INTO paseo_users (email, password, name, role) VALUES
('admin@paseoaranjuez.bo', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uMe6Ue52W', 'Admin Paseo', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Tiendas
INSERT INTO paseo_stores (name, description, category, floor, sector, local_num, schedule, is_active) VALUES
('TechZone Bolivia', 'Tecnologia, accesorios y gadgets de ultima generacion', 'tecnologia', 'Piso 1', 'Sector A', 'Local 105', 'Lun-Sab 9:00-20:00, Dom 10:00-18:00', true),
('Optica Vision', 'Lentes, monturas y examenes de la vista', 'salud', 'Piso 1', 'Sector B', 'Local 112', 'Lun-Sab 9:00-19:30', true),
('Moda Elite', 'Ropa y accesorios de moda para toda la familia', 'moda', 'Piso 2', 'Sector A', 'Local 204', 'Lun-Sab 9:00-20:00, Dom 10:00-18:00', true),
('Cafe Aranjuez', 'Cafeteria gourmet con desayunos, almuerzos y meriendas', 'gastronomia', 'Piso 1', 'Sector C', 'Local 118', 'Lun-Dom 7:30-21:00', true),
('Mundo Regalo', 'Regalos, detalles y souvenirs para todas las ocasiones', 'regalos', 'Piso 2', 'Sector B', 'Local 211', 'Lun-Sab 9:00-20:00', true),
('Libreria Central', 'Libros, papeleria, arte y entretenimiento', 'entretenimiento', 'Piso 1', 'Sector A', 'Local 108', 'Lun-Sab 8:30-20:00, Dom 10:00-17:00', true)
ON CONFLICT DO NOTHING;

-- Recompensas iniciales
INSERT INTO paseo_rewards (name, description, points_cost, category, stock) VALUES
('Cupon 5% de descuento', 'Descuento del 5% en cualquier tienda participante', 300, 'descuento', -1),
('Cafe gratis', 'Un cafe americano o cortado en Cafe Aranjuez', 500, 'producto', 50),
('Cupon Bs 20 de descuento', 'Descuento de Bs 20 en compras mayores a Bs 100', 1000, 'descuento', -1),
('Producto sorpresa', 'Un producto sorpresa valorado hasta Bs 50', 1500, 'producto', 20),
('Descuento 15% en Moda Elite', 'Cupon exclusivo para Moda Elite', 2000, 'exclusivo', 30),
('Pack Tecnologia', 'Accesorio tecnologico a elegir en TechZone', 3000, 'exclusivo', 10)
ON CONFLICT DO NOTHING;
