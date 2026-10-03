import { createClient, SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_URL = "https://xedrgakpummpqwamfyos.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_H8TpMGOgkP-_gzpO7aRRJg_y10HHWHa";

let publicClient: SupabaseClient | null = null;

// Cliente público seguro para el navegador (Google OAuth y llamadas frontend)
export function getPublicDB(): SupabaseClient {
  if (typeof window !== "undefined" && publicClient) {
    return publicClient;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

  const client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  if (typeof window !== "undefined") {
    publicClient = client;
  }
  return client;
}
