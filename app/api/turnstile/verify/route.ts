import { verifyTurnstileToken, getClientIp } from '@/lib/turnstile'
import { NextRequest, NextResponse } from 'next/server'

// Login authenticates directly against Supabase client-side (no API route
// of our own sits in front of signInWithPassword), so there's nowhere else
// to put a server-side CAPTCHA check for it. The login page calls this
// first and only proceeds to signInWithPassword if it succeeds.
export async function POST(request: NextRequest) {
  const { token } = await request.json()
  const ok = await verifyTurnstileToken(token, getClientIp(request))

  if (!ok) {
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
