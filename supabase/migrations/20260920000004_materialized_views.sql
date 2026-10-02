-- =============================================
-- MIGRACIÓN 04: Vistas Materializadas & pg_cron
-- KPIs y métricas precalculadas
-- =============================================

-- ============ SALES DAILY SUMMARY ============
CREATE MATERIALIZED VIEW IF NOT EXISTS sales_daily_summary AS
SELECT
  DATE(o.created_at) AS date,
  SUM(o.total) AS total_sales,
  COUNT(*)::int AS order_count,
  ROUND(AVG(o.total), 2) AS avg_ticket,
  COUNT(DISTINCT o.user_id)::int AS unique_customers
FROM orders o
WHERE o.status IN ('paid', 'shipped', 'delivered')
GROUP BY DATE(o.created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX idx_sales_daily_date ON sales_daily_summary(date);

-- ============ PRODUCT SALES SUMMARY ============
CREATE MATERIALIZED VIEW IF NOT EXISTS product_sales_summary AS
SELECT
  oi.product_id,
  p.name AS product_name,
  p.category_id,
  SUM(oi.quantity)::int AS total_sold,
  SUM(oi.subtotal) AS total_revenue,
  COUNT(DISTINCT oi.order_id)::int AS order_count
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status IN ('paid', 'shipped', 'delivered')
GROUP BY oi.product_id, p.name, p.category_id
ORDER BY total_revenue DESC;

CREATE UNIQUE INDEX idx_product_sales_product ON product_sales_summary(product_id);

-- ============ VENDOR SALES SUMMARY ============
CREATE MATERIALIZED VIEW IF NOT EXISTS vendor_sales_summary AS
SELECT
  o.vendor_id,
  pr.full_name AS vendor_name,
  SUM(o.total) AS total_sales,
  COUNT(*)::int AS order_count,
  ROUND(AVG(o.total), 2) AS avg_ticket
FROM orders o
JOIN profiles pr ON pr.id = o.vendor_id
WHERE o.status IN ('paid', 'shipped', 'delivered')
GROUP BY o.vendor_id, pr.full_name
ORDER BY total_sales DESC;

CREATE UNIQUE INDEX idx_vendor_sales_vendor ON vendor_sales_summary(vendor_id);

-- ============ CATEGORY SALES SUMMARY ============
CREATE MATERIALIZED VIEW IF NOT EXISTS category_sales_summary AS
SELECT
  p.category_id,
  c.name AS category_name,
  SUM(oi.subtotal) AS total_sales,
  COUNT(DISTINCT oi.order_id)::int AS order_count
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN categories c ON c.id = p.category_id
JOIN orders o ON o.id = oi.order_id
WHERE o.status IN ('paid', 'shipped', 'delivered')
GROUP BY p.category_id, c.name
ORDER BY total_sales DESC;

CREATE UNIQUE INDEX idx_category_sales_category ON category_sales_summary(category_id);

-- ============ REFRESH FUNCTION (callable via RPC or pg_cron) ============
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY sales_daily_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_sales_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY vendor_sales_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY category_sales_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ pg_cron JOBS (run these manually in Supabase SQL Editor) ============
-- Refresh materialized views every hour
-- SELECT cron.schedule('refresh-mat-views', '0 * * * *', 'SELECT refresh_all_materialized_views()');

-- Cleanup audit logs older than 1 year
-- SELECT cron.schedule('cleanup-old-audit-logs', '0 3 * * 0', $$DELETE FROM audit_logs WHERE created_at < now() - interval '1 year'$$);

-- Alert on low stock (daily at 8 AM)
-- SELECT cron.schedule('alert-low-stock', '0 8 * * *', $$
--   INSERT INTO system_alerts (type, severity, message)
--   SELECT 'low_stock', 'warning', 'Producto "' || name || '" tiene stock bajo: ' || stock || ' unidades'
--   FROM products
--   WHERE stock <= low_stock_threshold AND is_active = true AND deleted_at IS NULL
--     AND id NOT IN (
--       SELECT DISTINCT (message::jsonb->>'product_id')::uuid FROM system_alerts
--       WHERE type = 'low_stock' AND resolved = false
--     )
-- $$);
