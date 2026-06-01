import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const origin = request.nextUrl.origin
  const referer = request.headers.get('referer') || ''

  // If logging out from admin pages redirect to admin login
  if (referer.includes('/admin')) {
    return NextResponse.redirect(new URL('/admin-login', origin))
  }

  // Everyone else goes to homepage
  return NextResponse.redirect(new URL('/', origin))
}