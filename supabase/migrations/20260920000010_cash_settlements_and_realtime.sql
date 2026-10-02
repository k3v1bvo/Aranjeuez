-- ============================================================
-- MIGRACIÓN 10: Sistema de Rendición de Efectivo y Realtime (WebSockets)
-- Tienda Táctica Bolivia (Cochabamba)
-- Permite que los repartidores rindan el efectivo cobrado (COD / 50-50)
-- mediante transferencia QR Simple o entrega física en Base Heroínas.
-- Habilita WebSockets para actualización instantánea en vivo.
-- ============================================================

-- 1. Tabla de Rendición de Efectivo (Cash Settlements)
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

-- 2. Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_cash_settlements_driver ON public.cash_settlements(driver_id);
CREATE INDEX IF NOT EXISTS idx_cash_settlements_status ON public.cash_settlements(status);
CREATE INDEX IF NOT EXISTS idx_cash_settlements_created ON public.cash_settlements(created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.cash_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura general rendiciones" ON public.cash_settlements;
CREATE POLICY "Lectura general rendiciones" ON public.cash_settlements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar rendiciones repartidores" ON public.cash_settlements;
CREATE POLICY "Insertar rendiciones repartidores" ON public.cash_settlements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar rendiciones admin" ON public.cash_settlements;
CREATE POLICY "Actualizar rendiciones admin" ON public.cash_settlements FOR UPDATE USING (true);

-- 4. Replica Identity Full para eventos de actualización en tiempo real
ALTER TABLE public.cash_settlements REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- 5. Habilitar Supabase Realtime (WebSockets)
-- Agrega las tablas a la publicación supabase_realtime para escuchar cambios en vivo
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_settlements;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
EXCEPTION WHEN duplicate_object THEN null; END $$;
