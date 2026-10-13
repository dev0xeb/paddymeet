import { createAdminClient } from '@/lib/supabase-admin'
import { verifyTurnstileToken, getClientIp } from '@/lib/turnstile'
import { NextRequest, NextResponse } from 'next/server'

// Supabase's own resetPasswordForEmail sends a real recovery email (and, on
// this project, apparently provisions a usable account) for ANY email it's
// given, registered or not — it doesn't check our own users/organisers/
// admin_team tables first. So this route does that check server-side, and
// only forwards to Supabase when the email actually belongs to an account
// here. An unmatched email gets an explicit "not found" error back (a
// deliberate choice to prioritize clear feedback over hiding which emails
// are registered).
export async function POST(request: NextRequest) {
  try {
    const { email, turnstileToken } = await request.json()

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // This endpoint now says outright whether an email is registered (see
    // comment below) — without a human check in front of it, a bot could
    // enumerate every registered email on the platform by brute force.
    const verified = await verifyTurnstileToken(turnstileToken, getClientIp(request))
    if (!verified) {
      return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 400 })
    }

    const normalisedEmail = email.trim().toLowerCase()
    const adminClient = createAdminClient()

    const [{ data: explorer }, { data: organiser }, { data: admin }] = await Promise.all([
      adminClient.from('users').select('id').eq('email', normalisedEmail).maybeSingle(),
      adminClient.from('organisers').select('id').eq('email', normalisedEmail).maybeSingle(),
      adminClient.from('admin_team').select('id').eq('email', normalisedEmail).maybeSingle(),
    ])

    if (!explorer && !organiser && !admin) {
      return NextResponse.json({ error: 'No account found with this email address.' }, { status: 404 })
    }

    const { error } = await adminClient.auth.resetPasswordForEmail(normalisedEmail)
    if (error) {
      console.error('resetPasswordForEmail error:', error)
      return NextResponse.json({ error: 'Could not send a reset code. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Forgot-password error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
