// import { createServerClient } from '@supabase/ssr'; // Temporarily disabled for debugging
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // All logic has been temporarily removed to isolate the source of the crash.
  // This is now a "pass-through" middleware that does nothing.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};