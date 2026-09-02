import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient()
    const body = await request.json()
    const { type, ...formData } = body

    if (!formData.email || !formData.password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const email = formData.email.trim().toLowerCase()
    const password = formData.password

    if (type === 'explorer') {
      const cleanUsername = (formData.username || '').replace('@', '').trim()

      if (!cleanUsername) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 })
      }

      // Check if username already exists
      const { data: existingUser } = await adminClient
        .from('users')
        .select('id')
        .ilike('username', cleanUsername)
        .maybeSingle()

      if (existingUser) {
        return NextResponse.json({ error: 'This username is already taken. Please choose another.' }, { status: 400 })
      }

      // Check if email already exists
      const { data: existingEmail } = await adminClient
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingEmail) {
        return NextResponse.json({ error: 'An account with this email address already exists. Please log in.' }, { status: 400 })
      }

      // Create user in Supabase Auth with auto-confirmed email
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          account_type: 'explorer',
        }
      })

      if (authError || !authData.user) {
        return NextResponse.json({ error: authError?.message || 'Failed to create user account' }, { status: 400 })
      }

      // Look up referrer if a referral code was provided
      let referredBy = null
      if (formData.referralCode) {
        const { data: referrer } = await adminClient
          .from('users')
          .select('id')
          .eq('referral_code', formData.referralCode.toUpperCase().trim())
          .maybeSingle()
        if (referrer) referredBy = referrer.id
      }

      const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      const { error: profileError } = await adminClient
        .from('users')
        .insert({
          id: authData.user.id,
          username: cleanUsername,
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          email,
          phone: formData.phone || null,
          age: formData.age || null,
          gender: formData.gender || null,
          city: formData.city || null,
          state: formData.state || null,
          trust_score: 50,
          tier: 'Newbie',
          referral_code: referralCode,
          referred_by: referredBy,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }

      // Award referral points to the referrer
      if (referredBy) {
        const { data: settings } = await adminClient
          .from('platform_settings')
          .select('referral_signup_points')
          .eq('id', 1)
          .maybeSingle()

        const points = settings?.referral_signup_points ?? 10

        const { data: referrerProfile } = await adminClient
          .from('users')
          .select('referral_points')
          .eq('id', referredBy)
          .maybeSingle()

        await adminClient
          .from('users')
          .update({ referral_points: (referrerProfile?.referral_points || 0) + points })
          .eq('id', referredBy)

        await adminClient.from('notifications').insert({
          user_id: referredBy,
          title: 'Referral bonus! 🎉',
          message: `You earned ${points} points because a friend signed up using your referral code.`,
          type: 'referral',
          is_read: false,
        })
      }

      if (formData.interests && Array.isArray(formData.interests) && formData.interests.length > 0) {
        await adminClient
          .from('user_interests')
          .insert(formData.interests.map((interest: string) => ({
            user_id: authData.user!.id,
            interest,
          })))
      }

      return NextResponse.json({ success: true, email, userId: authData.user.id })
    }

    if (type === 'organiser') {
      // Check if organiser email already exists
      const { data: existingOrg } = await adminClient
        .from('organisers')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingOrg) {
        return NextResponse.json({ error: 'An organiser account with this email address already exists. Please log in.' }, { status: 400 })
      }

      // Create organiser in Supabase Auth with auto-confirmed email
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: formData.contactName,
          account_type: 'organiser',
        }
      })

      if (authError || !authData.user) {
        return NextResponse.json({ error: authError?.message || 'Failed to create organiser account' }, { status: 400 })
      }

      const { error: orgError } = await adminClient
        .from('organisers')
        .insert({
          id: authData.user.id,
          org_name: formData.orgName,
          contact_name: formData.contactName,
          email,
          phone: formData.phone || null,
          website: formData.website || null,
          description: formData.description || null,
          is_verified: true,
          is_active: true,
        })

      if (orgError) {
        console.error('Organiser insertion error:', orgError)
        return NextResponse.json({ error: orgError.message }, { status: 400 })
      }

      if (formData.eventTypes && Array.isArray(formData.eventTypes) && formData.eventTypes.length > 0) {
        await adminClient
          .from('organiser_event_types')
          .insert(formData.eventTypes.map((eventType: string) => ({
            organiser_id: authData.user!.id,
            event_type: eventType,
          })))
      }

      return NextResponse.json({ success: true, email, userId: authData.user.id })
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error occurred during signup' }, { status: 500 })
  }
}
