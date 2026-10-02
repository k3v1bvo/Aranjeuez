-- ======================================================================
-- MIGRACIÓN 09: Sistema de Notificaciones Bancarias Android & Conciliación AI (Gemini)
-- Captura de notificaciones de bancos bolivianos (BNB, BCP, Banco Unión, etc.)
-- Tablas para QRs fijos y análisis multimodal de comprobantes (OCR)
-- ======================================================================

-- 1. Tabla de Notificaciones Bancarias recibidas por la app Android
CREATE TABLE IF NOT EXISTS bank_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,                    -- 'BNB', 'BCP', 'Banco Unión', 'BMSC', 'Banco FIE', etc.
  raw_text text NOT NULL,                     -- Texto íntegro de la notificación push capturada
  amount numeric(10,2) NOT NULL,              -- Monto parseado en Bolivianos (Bs.)
  sender_name text,                           -- Nombre del depositante si la notificación lo incluye
  transaction_ref text,                       -- Código de referencia o nro de transacción
  received_at timestamptz DEFAULT now(),      -- Fecha y hora exacta de la notificación en el celular
  status text DEFAULT 'unmatched',            -- 'unmatched', 'matched', 'flagged', 'manual_review'
  matched_order_id text REFERENCES orders(id) ON DELETE SET NULL,
  confidence_score numeric(5,2) DEFAULT 0,    -- Puntuación de confianza de coincidencia (0-100%)
  device_id text,                             -- Identificador del celular que capturó la notificación
  created_at timestamptz DEFAULT now()
);

-- Índices para búsqueda ultra rápida por monto y estado
CREATE INDEX IF NOT EXISTS idx_bank_notif_amount ON bank_notifications(amount);
CREATE INDEX IF NOT EXISTS idx_bank_notif_status ON bank_notifications(status);
CREATE INDEX IF NOT EXISTS idx_bank_notif_received ON bank_notifications(received_at);

-- 2. Tabla de QRs con Montos Específicos (Subidos por el Dueño)
CREATE TABLE IF NOT EXISTS fixed_amount_qrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric(10,2) NOT NULL,              -- Monto exacto (ej. 10.00, 20.00, 150.00, 289.99)
  qr_image_url text NOT NULL,                 -- Link URL de la imagen en ImgBB
  bank_name text DEFAULT 'Simple QR Bolivia', -- Nombre del banco o servicio
  account_name text,                          -- Titular de la cuenta
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fixed_qrs_amount ON fixed_amount_qrs(amount);

-- 3. Tabla de Verificaciones de Pago con Inteligencia Artificial (Gemini Vision OCR)
CREATE TABLE IF NOT EXISTS payment_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  voucher_url text NOT NULL,                  -- Link URL del comprobante alojado en ImgBB
  gemini_extracted_data jsonb,                -- { amount, date, bank, reference, sender_name, confidence }
  bank_notification_id uuid REFERENCES bank_notifications(id) ON DELETE SET NULL,
  match_status text DEFAULT 'pending',        -- 'matched_auto', 'discrepancy_amount', 'discrepancy_name', 'manual_approved'
  ai_analysis_notes text,                     -- Explicación del modelo Gemini si hubo discrepancias
  verified_by text DEFAULT 'gemini_vision',
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS: Solo Admin puede leer/escribir todas las notificaciones y verificaciones
ALTER TABLE bank_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_amount_qrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- Política para que la app Android pueda insertar notificaciones (con API key de servicio o anon)
CREATE POLICY "Permitir insercion de notificaciones bancarias"
  ON bank_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin gestion total notificaciones"
  ON bank_notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Lectura publica de QRs activos"
  ON fixed_amount_qrs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin gestion QRs fijos"
  ON fixed_amount_qrs FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin gestion verificaciones AI"
  ON payment_verifications FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
