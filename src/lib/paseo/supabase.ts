import { createClient, SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_URL = "https://xedrgakpummpqwamfyos.supabase.co"
const DEFAULT_ANON_KEY = "sb_publishable_H8TpMGOgkP-_gzpO7aRRJg_y10HHWHa"

// En Node.js (servidor), evitar crash de realtime WebSocket
if (typeof window === "undefined" && typeof (globalThis as any).WebSocket === "undefined") {
  (globalThis as any).WebSocket = class {}
}

let publicClient: SupabaseClient | null = null

// Cliente publico (para browser / Realtime WebSockets / client components)
export function getPublicDB(): SupabaseClient {
  if (typeof window !== "undefined" && publicClient) {
    return publicClient
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY

  const client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  if (typeof window !== "undefined") {
    publicClient = client
  }
  return client
}

// Crea un cliente admin en cada llamada de servidor
export function getDB(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_ANON_KEY

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
