import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    }
  )
}

export function handleAuthError(error: any) {
  if (error?.message?.includes('Invalid Refresh Token') || 
      error?.message?.includes('Already Used')) {
    // Limpiar sesión
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
    return true
  }
  return false
}
