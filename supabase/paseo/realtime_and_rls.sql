-- ============================================================
-- PASEO ARANJUEZ - Realtime + Permisos
-- Ejecutar DESPUES del schema.sql principal en SQL Editor
-- ============================================================

-- 1. HABILITAR REALTIME en tablas clave
ALTER PUBLICATION supabase_realtime ADD TABLE paseo_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE paseo_point_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE paseo_products;

-- 2. DESHABILITAR RLS (usamos JWT propio)
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

-- 3. PERMISOS para el rol anon (publishable key)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. VERIFICAR tablas creadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'paseo_%'
ORDER BY table_name;