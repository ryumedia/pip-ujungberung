import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Cek Environment Variables dengan aman
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ CRITICAL: Supabase Environment Variables are missing in Middleware!')
    // Return next() agar aplikasi tidak crash 500, meskipun auth tidak jalan
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

    // 2. Cek User Session
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
       // Log error tapi jangan crash
       console.error('Supabase Auth Error:', error.message)
    }

    const path = request.nextUrl.pathname

    // 3. Logika Redirect
    // Jika user login & akses root -> redirect ke dashboard
    if (user && path === '/') {
      return NextResponse.redirect(new URL('/pengajuan', request.url))
    }

    // Jika user belum login & mencoba akses halaman protected -> redirect ke login
    if (!user && (path.startsWith('/admin') || path.startsWith('/pengajuan'))) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch (e) {
    // Tangkap error tak terduga agar tidak 500
    console.error('Middleware Unexpected Error:', e)
    return NextResponse.next()
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua path permintaan kecuali yang dimulai dengan:
     * - _next/static (file statis)
     * - _next/image (file optimasi gambar)
     * - favicon.ico (file favicon)
     * - file gambar umum (svg, png, jpg, dll)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}