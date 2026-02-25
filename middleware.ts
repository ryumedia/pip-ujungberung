import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Cek Env Vars untuk mencegah error 500 "MIDDLEWARE_INVOCATION_FAILED"
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Menyegarkan sesi jika sudah kedaluwarsa - ini adalah titik rawan error
    const { data, error } = await supabase.auth.getUser()
    const user = data?.user

    // 1. Jika user sudah login dan ada di halaman root (login), redirect ke dashboard
    if (user && request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/pengajuan', request.url))
    }

    // 2. Jika user belum login dan mencoba akses halaman admin, redirect ke login
    if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/pengajuan'))) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch (e) {
    // Jika terjadi error APAPUN selama interaksi Supabase, log error tersebut
    // dan kembalikan response awal. Ini akan MENCEGAH crash 500.
    console.error("Error in Supabase middleware:", e);
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
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}