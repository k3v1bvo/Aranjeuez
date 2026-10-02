// Supabase Edge Function: verify_payment
// Idempotent payment verification transitioning orders to 'paid' and logging audit event
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

    const { paymentId, verifiedBy, notes } = await req.json();

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "Missing required paymentId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Get payment verification record
    const { data: payment, error: pError } = await supabase
      .from("payment_verifications")
      .select("*, orders(*)")
      .eq("id", paymentId)
      .single();

    if (pError || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment verification not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payment.status === "verified") {
      return new Response(
        JSON.stringify({ message: "Payment was already verified", payment }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date().toISOString();

    // 2. Update payment_verification to 'verified'
    const { data: updatedPayment, error: uError } = await supabase
      .from("payment_verifications")
      .update({
        status: "verified",
        verified_at: now,
        verified_by: verifiedBy || null,
        notes: notes || "Verificado via Edge Function",
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (uError) throw uError;

    // 3. Update order status to 'paid'
    const { error: oError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        updated_at: now,
      })
      .eq("id", payment.order_id);

    if (oError) throw oError;

    // 4. Log audit entry
    await supabase.from("audit_logs").insert({
      user_id: verifiedBy || null,
      action: "PAYMENT_VERIFIED",
      entity_type: "payment_verifications",
      entity_id: paymentId,
      old_data: { status: payment.status },
      new_data: { status: "verified", order_id: payment.order_id, verified_at: now },
    });

    return new Response(
      JSON.stringify({ success: true, payment: updatedPayment }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
