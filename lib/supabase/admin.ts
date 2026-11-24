import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase con Service Role Key para operaciones administrativas
 * Bypassea RLS (Row Level Security) para operaciones de backend
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey, // Service Role Key para bypass RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
