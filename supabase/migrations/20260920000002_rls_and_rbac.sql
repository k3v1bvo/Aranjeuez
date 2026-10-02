-- =============================================
-- MIGRACIÓN 02: RLS & RBAC
-- Row Level Security + Authorization Function
-- =============================================

-- ============ AUTHORIZATION FUNCTION ============
CREATE OR REPLACE FUNCTION public.authorize(requested_permission text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = auth.uid()
      AND rp.permission = requested_permission
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: check if current user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = required_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============ ENABLE RLS ON ALL TABLES ============
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============ PROFILES ============
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE TO authenticated
  USING (has_role('admin'));

-- ============ USER ROLES ============
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Admin can manage all roles"
  ON user_roles FOR ALL TO authenticated
  USING (has_role('admin'));

-- ============ ROLE PERMISSIONS ============
CREATE POLICY "Anyone authenticated can view permissions"
  ON role_permissions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage permissions"
  ON role_permissions FOR ALL TO authenticated
  USING (has_role('admin'));

-- ============ CATEGORIES ============
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage categories"
  ON categories FOR ALL TO authenticated
  USING (has_role('admin'));

-- ============ PRODUCTS ============
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Vendors can view own products (including inactive)"
  ON products FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Admin can view all products"
  ON products FOR SELECT TO authenticated
  USING (has_role('admin'));

CREATE POLICY "Vendors can create own products"
  ON products FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid() AND (has_role('vendor') OR has_role('admin')));

CREATE POLICY "Vendors can update own products"
  ON products FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid() OR has_role('admin'))
  WITH CHECK (vendor_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Vendors can soft-delete own products"
  ON products FOR DELETE TO authenticated
  USING (vendor_id = auth.uid() OR has_role('admin'));

-- ============ CARTS ============
CREATE POLICY "Users can manage own cart"
  ON carts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all carts"
  ON carts FOR SELECT TO authenticated
  USING (has_role('admin'));

-- ============ CART ITEMS ============
CREATE POLICY "Users can manage own cart items"
  ON cart_items FOR ALL TO authenticated
  USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  )
  WITH CHECK (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can view all cart items"
  ON cart_items FOR SELECT TO authenticated
  USING (has_role('admin'));

-- ============ ORDERS ============
CREATE POLICY "Clients can view own orders"
  ON orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Vendors can view assigned orders"
  ON orders FOR SELECT TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Admin can view all orders"
  ON orders FOR SELECT TO authenticated
  USING (has_role('admin'));

CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin or vendor can update order status"
  ON orders FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid() OR has_role('admin'));

-- ============ ORDER ITEMS ============
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid() OR vendor_id = auth.uid())
    OR has_role('admin')
  );

CREATE POLICY "Users can insert order items on own orders"
  ON order_items FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- ============ PAYMENT VERIFICATIONS ============
CREATE POLICY "Client can create payment verification"
  ON payment_verifications FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

CREATE POLICY "Vendor/Admin can view and update payment verifications"
  ON payment_verifications FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE vendor_id = auth.uid())
    OR has_role('admin')
  );

CREATE POLICY "Vendor/Admin can verify payments"
  ON payment_verifications FOR UPDATE TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE vendor_id = auth.uid())
    OR has_role('admin')
  );

-- ============ PUSH TOKENS ============
CREATE POLICY "Users can manage own push tokens"
  ON push_tokens FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all push tokens"
  ON push_tokens FOR SELECT TO authenticated
  USING (has_role('admin'));

-- ============ AUDIT LOGS ============
CREATE POLICY "Only admin can view audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (has_role('admin'));

-- Insert via trigger/edge function runs as SECURITY DEFINER, so no INSERT policy needed for users

-- ============ SYSTEM ALERTS ============
CREATE POLICY "Only admin can view system alerts"
  ON system_alerts FOR SELECT TO authenticated
  USING (has_role('admin'));

CREATE POLICY "Only admin can manage system alerts"
  ON system_alerts FOR ALL TO authenticated
  USING (has_role('admin'));

-- ============ NOTIFICATIONS ============
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications (mark as read)"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);  -- Controlled by Edge Functions / triggers
