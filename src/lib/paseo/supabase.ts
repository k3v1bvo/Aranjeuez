import { createClient } from "@supabase/supabase-js"

// Crea un cliente admin nuevo en cada llamada (seguro en server-side, no se comparte estado)
export function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Cliente publico (para browser / uso en client components)
export function getPublicDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  return createClient(url, key)
}
