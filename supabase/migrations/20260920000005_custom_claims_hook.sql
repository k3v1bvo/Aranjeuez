-- =============================================
-- MIGRACIÓN 05: Custom Access Token Hook
-- Inyecta user_role en JWT claims
-- =============================================

-- This function is called by Supabase Auth on every token refresh
-- Configure it in: Authentication > Hooks > Custom Access Token
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  claims jsonb;
  user_role app_role;
  user_permissions text[];
BEGIN
  -- Get the primary role for the user (highest privilege: admin > vendor > client)
  SELECT ur.role INTO user_role
  FROM public.user_roles ur
  WHERE ur.user_id = (event->>'user_id')::uuid
  ORDER BY
    CASE ur.role
      WHEN 'admin' THEN 1
      WHEN 'vendor' THEN 2
      WHEN 'client' THEN 3
    END
  LIMIT 1;

  -- Get all permissions for this user
  SELECT ARRAY_AGG(DISTINCT rp.permission) INTO user_permissions
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role = rp.role
  WHERE ur.user_id = (event->>'user_id')::uuid;

  -- Build claims
  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    claims := jsonb_set(claims, '{user_permissions}', to_jsonb(COALESCE(user_permissions, ARRAY[]::text[])));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"client"');
    claims := jsonb_set(claims, '{user_permissions}', '[]');
  END IF;

  -- Return modified event
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke from public
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated;
