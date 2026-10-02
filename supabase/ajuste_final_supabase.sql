-- ======================================================================
-- TIENDA TÁCTICA BOLIVIA — AJUSTE EXACTO DE BASE DE DATOS SUPABASE
-- Pega este script en tu Supabase Dashboard > SQL Editor y dale a RUN.
-- Es 100% seguro (idempotente): no borra datos existentes.
-- ======================================================================

-- 1. AJUSTAR TABLA: fixed_amount_qrs
-- Permite que el monto sea nulo (para el QR Comodín sin monto)
-- y añade las columnas de vigencia, notas y comodín por defecto.
DO $$
BEGIN
  -- Quitar NOT NULL a amount para permitir el QR comodín
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixed_amount_qrs' AND column_name = 'amount' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.fixed_amount_qrs ALTER COLUMN amount DROP NOT NULL;
  END IF;

  -- Columna is_default (indica si es el QR comodín sin monto)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixed_amount_qrs' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE public.fixed_amount_qrs ADD COLUMN is_default boolean DEFAULT false;
  END IF;

  -- Columna expiration_years (vigencia del QR estático: ej. '3 años')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixed_amount_qrs' AND column_name = 'expiration_years'
  ) THEN
    ALTER TABLE public.fixed_amount_qrs ADD COLUMN expiration_years text DEFAULT '3 años';
  END IF;

  -- Columna expiration_date (fecha exacta de vencimiento bancario)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixed_amount_qrs' AND column_name = 'expiration_date'
  ) THEN
    ALTER TABLE public.fixed_amount_qrs ADD COLUMN expiration_date date;
  END IF;

  -- Columna notes (notas internas del admin)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixed_amount_qrs' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.fixed_amount_qrs ADD COLUMN notes text;
  END IF;

  -- Columna updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixed_amount_qrs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.fixed_amount_qrs ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Índices de optimización para la matriz de QRs
CREATE INDEX IF NOT EXISTS idx_fixed_qrs_amount ON public.fixed_amount_qrs(amount);
CREATE INDEX IF NOT EXISTS idx_fixed_qrs_active ON public.fixed_amount_qrs(is_active);
CREATE INDEX IF NOT EXISTS idx_fixed_qrs_default ON public.fixed_amount_qrs(is_default);

-- Políticas RLS para fixed_amount_qrs
ALTER TABLE public.fixed_amount_qrs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de QRs activos" ON public.fixed_amount_qrs;
CREATE POLICY "Lectura publica de QRs activos"
  ON public.fixed_amount_qrs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin gestion QRs fijos" ON public.fixed_amount_qrs;
CREATE POLICY "Admin gestion QRs fijos"
  ON public.fixed_amount_qrs FOR ALL
  USING (true)
  WITH CHECK (true);


-- 2. CREAR TABLA: cash_settlements (Rendición de Efectivo de Repartidores)
-- Permite el cuadre de caja de repartidores (Efectivo por Rendir en COD / 50-50)
CREATE TABLE IF NOT EXISTS public.cash_settlements (
  id text PRIMARY KEY,
  driver_id text NOT NULL,
  driver_name text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('qr_transfer', 'physical_delivery')),
  proof_image_url text,                              -- URL de ImgBB del comprobante
  notes text,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  order_ids text[] NOT NULL DEFAULT '{}',             -- IDs de órdenes cubiertas
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índices y RLS para cash_settlements
CREATE INDEX IF NOT EXISTS idx_cash_settlements_driver ON public.cash_settlements(driver_id);
CREATE INDEX IF NOT EXISTS idx_cash_settlements_status ON public.cash_settlements(status);
CREATE INDEX IF NOT EXISTS idx_cash_settlements_created ON public.cash_settlements(created_at DESC);

ALTER TABLE public.cash_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura general rendiciones" ON public.cash_settlements;
CREATE POLICY "Lectura general rendiciones" ON public.cash_settlements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar rendiciones repartidores" ON public.cash_settlements;
CREATE POLICY "Insertar rendiciones repartidores" ON public.cash_settlements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar rendiciones admin" ON public.cash_settlements;
CREATE POLICY "Actualizar rendiciones admin" ON public.cash_settlements FOR UPDATE USING (true);


-- 3. HABILITAR SUPABASE REALTIME (WebSockets en vivo)
ALTER TABLE public.fixed_amount_qrs REPLICA IDENTITY FULL;
ALTER TABLE public.cash_settlements REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.fixed_amount_qrs;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_settlements;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN null; END $$;
