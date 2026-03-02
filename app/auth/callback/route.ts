import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

if (code) {
  const cookieStore = cookies() // <-- Hapus await, biarkan berupa Promise
  const supabase = await createClient(cookieStore) // <-- Tambahkan await di sini (karena createClient kemungkinan async)
  
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (!error) {
    return NextResponse.redirect(`${origin}${next}`)
  }
}

  // return the user to an error page with instructions
  return NextResponse.redirect(`/auth/auth-code-error`)
}
