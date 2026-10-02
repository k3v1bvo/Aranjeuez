import { createClient, SupabaseClient } from "@supabase/supabase-js"

let publicClient: SupabaseClient | null = null

// Cliente publico (para browser / Realtime WebSockets / client components)
export function getPublicDB(): SupabaseClient {
  if (typeof window !== "undefined" && publicClient) {
    return publicClient
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}