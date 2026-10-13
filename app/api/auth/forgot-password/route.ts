import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// Supabase's own resetPasswordForEmail sends a real recovery email (and, on
// this project, apparently provisions a usable account) for ANY email it's
// given, registered or not — it doesn't check our own users/organisers/
// admin_team tables first. So this route does that check server-side, and
// only forwards to Supabase when the email actually belongs to an account
// here. Either way the response is identical — no error, no "not found" —
// so the HTTP response itself can't be used to enumerate which emails are
// registered.
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalisedEmail = email.trim().toLowerCase()
    const adminClient = createAdminClient()

    const [{ data: explorer }, { data: organiser }, { data: admin }] = await Promise.all([
      adminClient.from('users').select('id').eq('email', normalisedEmail).maybeSingle(),
      adminClient.from('organisers').select('id').eq('email', normalisedEmail).maybeSingle(),
      adminClient.from('admin_team').select('id').eq('email', normalisedEmail).maybeSingle(),
    ])

    if (explorer || organiser || admin) {
      const { error } = await adminClient.auth.resetPasswordForEmail(normalisedEmail)
      if (error) {
        console.error('resetPasswordForEmail error:', error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Forgot-password error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
