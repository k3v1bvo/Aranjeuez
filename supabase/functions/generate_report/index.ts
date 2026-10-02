// Supabase Edge Function: generate_report
// Generates CSV / JSON sales and audit reports with date filters
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type = "sales", format = "csv", startDate, endDate } = await req.json();

    let data: unknown[] = [];

    if (type === "sales") {
      let query = supabase.from("orders").select("id, total, status, created_at, customer_id");
      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate);
      const res = await query;
      data = res.data || [];
    } else if (type === "products") {
      const res = await supabase.from("products").select("id, name, price, stock, is_active");
      data = res.data || [];
    } else if (type === "audit") {
      const res = await supabase.from("audit_logs").select("*").limit(500);
      data = res.data || [];
    }

    if (format === "csv") {
      if (data.length === 0) {
        return new Response("No data available", {
          headers: { ...corsHeaders, "Content-Type": "text/csv" },
        });
      }
      const keys = Object.keys(data[0] as Record<string, unknown>);
      const csvRows = [
        keys.join(","),
        ...data.map((row) =>
          keys
            .map((k) => JSON.stringify((row as Record<string, unknown>)[k] ?? ""))
            .join(",")
        ),
      ];
      return new Response(csvRows.join("\n"), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="report_${type}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Report generation failed";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
