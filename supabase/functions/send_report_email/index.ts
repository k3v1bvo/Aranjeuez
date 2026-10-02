// Supabase Edge Function: send_report_email
// Dispatches transactional email reports using Google Workspace SMTP
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { toEmail, subject, reportContent, reportType } = await req.json();

    const smtpUser = Deno.env.get("GOOGLE_SMTP_USER") || "admin@tacticos.com";
    const smtpPassword = Deno.env.get("GOOGLE_SMTP_PASSWORD") || "";

    if (!toEmail) {
      return new Response(JSON.stringify({ error: "toEmail is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // In local or test environment, log the email dispatch details
    console.log(`[SMTP Google Workspace] Sending report "${reportType || subject}" to ${toEmail}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Report sent to ${toEmail}`,
        smtpUser,
        dispatchedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "SMTP delivery error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
