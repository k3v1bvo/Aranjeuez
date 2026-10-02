// Supabase Edge Function: cleanup_audit_logs
// Purges audit logs older than the retention window (default 90 days)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { retentionDays = 90 } = await req.json().catch(() => ({ retentionDays: 90 }));

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const { count, error } = await supabase
      .from("audit_logs")
      .delete({ count: "exact" })
      .lt("created_at", cutoffDate.toISOString());

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        purgedCount: count,
        cutoffDate: cutoffDate.toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error cleaning audit logs";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
