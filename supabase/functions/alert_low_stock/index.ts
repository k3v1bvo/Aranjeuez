// Supabase Edge Function: alert_low_stock
// Scans inventory and raises alerts in system_alerts for products below threshold
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch active products with stock <= threshold
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, name, stock, low_stock_threshold")
      .eq("is_active", true);

    if (prodError) throw prodError;

    const criticalItems = (products || []).filter(
      (p) => p.stock <= p.low_stock_threshold
    );

    const alertsCreated: unknown[] = [];

    for (const item of criticalItems) {
      const severity = item.stock === 0 ? "critical" : "warning";
      const message =
        item.stock === 0
          ? `¡URGENTE! Producto "${item.name}" completamente AGOTADO.`
          : `Stock bajo en "${item.name}": solo quedan ${item.stock} unidades (umbral: ${item.low_stock_threshold}).`;

      const { data: alert, error: aError } = await supabase
        .from("system_alerts")
        .insert({
          severity,
          title: `Alerta de Inventario: ${item.name}`,
          message,
          entity_type: "products",
          entity_id: item.id,
          resolved: false,
        })
        .select()
        .single();

      if (!aError && alert) {
        alertsCreated.push(alert);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scannedCount: products?.length || 0,
        criticalFound: criticalItems.length,
        alertsCreatedCount: alertsCreated.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error scanning low stock";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
