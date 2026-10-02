-- =============================================
-- MIGRACIÓN 03: Triggers de Auditoría
-- Captura INSERT/UPDATE/DELETE con diff JSON
-- =============================================

CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
DECLARE
  _user_id uuid;
  _action text;
  _before jsonb;
  _after jsonb;
BEGIN
  -- Get current authenticated user (NULL for system operations)
  _user_id := auth.uid();

  -- Determine action
  _action := TG_OP;

  -- Capture before/after
  IF TG_OP = 'DELETE' THEN
    _before := to_jsonb(OLD);
    _after := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    _before := NULL;
    _after := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    _before := to_jsonb(OLD);
    _after := to_jsonb(NEW);
  END IF;

  INSERT INTO audit_logs (user_id, action, entity, entity_id, before, after)
  VALUES (
    _user_id,
    _action,
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN (OLD.id)::uuid
      ELSE (NEW.id)::uuid
    END,
    _before,
    _after
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_payment_verifications
  AFTER INSERT OR UPDATE OR DELETE ON payment_verifications
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_categories
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION log_audit();
