-- ======================================================================
-- MIGRACIÓN 11: Matriz de Códigos QR Estáticos (ImgBB & Supabase)
-- Soporte para QRs estáticos de 3+ años con monto específico y QR comodín sin monto
-- ======================================================================

-- 1. Asegurar que la tabla fixed_amount_qrs existe con todas las columnas necesarias
CREATE TABLE IF NOT EXISTS fixed_amount_qrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric(10,2),                        -- Monto exacto (null para QR comodín sin monto)
  qr_image_url text NOT NULL,                 -- Link directo a ImgBB
  bank_name text DEFAULT 'Simple QR Bolivia', -- Banco emisor (BCP, BNB, Banco Unión, etc.)
  account_name text,                          -- Titular de la cuenta bancaria
  is_active boolean DEFAULT true,             -- Si está activo para despachar
  is_default boolean DEFAULT false,           -- True si es el QR comodín de respaldo
  expiration_years text DEFAULT '3 años',     -- Tiempo de vigencia del QR estático
  notes text,                                 -- Notas o glosa interna
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Si la tabla ya existía, ajustar columnas
DO $$
BEGIN
  -- Permitir monto nulo para el QR sin monto
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixed_amount_qrs' AND column_name = 'amount' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE fixed_amount_qrs ALTER COLUMN amount DROP NOT NULL;
  END IF;

  -- Agregar is_default si falta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixed_amount_qrs' AND column_name = 'is_default'
  ) THEN
    ALTER TABLE fixed_amount_qrs ADD COLUMN is_default boolean DEFAULT false;
  END IF;

  -- Agregar expiration_years si falta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixed_amount_qrs' AND column_name = 'expiration_years'
  ) THEN
    ALTER TABLE fixed_amount_qrs ADD COLUMN expiration_years text DEFAULT '3 años';
  END IF;

  -- Agregar notes si falta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixed_amount_qrs' AND column_name = 'notes'
  ) THEN
    ALTER TABLE fixed_amount_qrs ADD COLUMN notes text;
  END IF;

  -- Agregar updated_at si falta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fixed_amount_qrs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE fixed_amount_qrs ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 3. Índices de optimización
CREATE INDEX IF NOT EXISTS idx_fixed_qrs_amount ON fixed_amount_qrs(amount);
CREATE INDEX IF NOT EXISTS idx_fixed_qrs_active ON fixed_amount_qrs(is_active);
CREATE INDEX IF NOT EXISTS idx_fixed_qrs_default ON fixed_amount_qrs(is_default);

-- 4. Políticas RLS
ALTER TABLE fixed_amount_qrs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de QRs activos" ON fixed_amount_qrs;
CREATE POLICY "Lectura publica de QRs activos"
  ON fixed_amount_qrs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin gestion QRs fijos" ON fixed_amount_qrs;
CREATE POLICY "Admin gestion QRs fijos"
  ON fixed_amount_qrs FOR ALL
  USING (true)
  WITH CHECK (true);
