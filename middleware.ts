import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Added for Vercel debugging
  console.log('Middleware Check:', {
    url: `Type: ${typeof supabaseUrl}, Length: ${supabaseUrl?.length ?? 0}`,
    key: `Type: ${typeof supabaseAnonKey}, Length: ${supabaseAnonKey?.length ?? 0}`,
  });

  // More robust check for Vercel environment
  if (!supabaseUrl || supabaseUrl.length === 0 || !supabaseAnonKey || supabaseAnonKey.length === 0) {
    console.error('CRITICAL: Supabase environment variables are missing or empty in the Vercel environment.');
    // Stop further execution if env vars are not set correctly
    return new Response('Internal Server Error: Missing Configuration', { status: 500 });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const { data: { user } } = await supabase.auth.getUser()

  if (user && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/pengajuan', request.url))
  }

  if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/pengajuan'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
