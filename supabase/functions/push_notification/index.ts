// Supabase Edge Function: push_notification
// Sends push notifications to vendors/admins via Expo Push API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  toUserId?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  priority?: "default" | "normal" | "high";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: PushPayload = await req.json();

    // Fetch active push tokens for target user or broadcast to vendors/admins
    let query = supabaseClient
      .from("push_tokens")
      .select("token, user_id")
      .eq("is_active", true);

    if (payload.toUserId) {
      query = query.eq("user_id", payload.toUserId);
    }

    const { data: tokens, error: tokenError } = await query;
    if (tokenError) throw tokenError;

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active push tokens found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare messages for Expo Push API
    const messages = tokens.map((t) => ({
      to: t.token,
      sound: payload.sound || "default",
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      priority: payload.priority || "high",
      channelId: "payments",
    }));

    // Send to Expo Push Service
    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const expoResult = await expoResponse.json();

    return new Response(JSON.stringify({ success: true, result: expoResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
