// Supabase Edge Function: auth_hook
// Custom Access Token (JWT) Hook for injecting role and permissions into user claims
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { user_id, claims } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Look up assigned role for user
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user_id)
      .single();

    const role = userRole?.role || "client";

    // Look up permissions for that role
    const { data: rolePerms } = await supabase
      .from("role_permissions")
      .select("permission")
      .eq("role", role);

    const permissions = rolePerms?.map((p) => p.permission) || [];

    // Inject into custom claims
    claims.user_role = role;
    claims.user_permissions = permissions;

    return new Response(JSON.stringify({ claims }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error in auth hook";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
