import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  try {
    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // EXCEPTION: Allow access to /admin/login without session
    if (request.nextUrl.pathname === '/admin/login') {
      return supabaseResponse
    }

    // Protect admin routes
    if (
      !session &&
      request.nextUrl.pathname.startsWith('/admin')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    // IMPORTANT: Clear invalid session if refresh token error
    const { error: sessionError } = await supabase.auth.getUser()
    if (sessionError?.message?.includes('Invalid Refresh Token') || 
        sessionError?.message?.includes('Already Used')) {
      
      // Clear all auth cookies
      supabaseResponse.cookies.getAll().forEach(cookie => {
        if (cookie.name.includes('supabase.auth')) {
          supabaseResponse.cookies.delete(cookie.name)
        }
      })
      
      console.error('Invalid refresh token detected, clearing session')
    }

  } catch (error) {
    console.error('Session update error:', error)
  }

  return supabaseResponse
}
