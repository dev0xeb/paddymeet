import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { type, ...formData } = body

  if (type === 'explorer') {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: `${formData.firstName} ${formData.lastName}`,
          account_type: 'explorer',
        }
      }
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    if (!authData.user) return NextResponse.json({ error: 'Something went wrong' }, { status: 400 })

// Look up referrer if a referral code was provided
    let referredBy = null
    if (formData.referralCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', formData.referralCode.toUpperCase())
        .single()
      if (referrer) referredBy = referrer.id
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username: formData.username.replace('@', ''),
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        age: formData.age,
        gender: formData.gender,
        city: formData.city,
        state: formData.state,
        trust_score: 50,
        tier: 'Newbie',
        referral_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
        referred_by: referredBy,
      })
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

    // Award referral points to the referrer
    if (referredBy) {
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('referral_signup_points')
        .eq('id', 1)
        .single()

      const points = settings?.referral_signup_points ?? 10

      const { data: referrerProfile } = await supabase
        .from('users')
        .select('referral_points')
        .eq('id', referredBy)
        .single()

      await supabase
        .from('users')
        .update({ referral_points: (referrerProfile?.referral_points || 0) + points })
        .eq('id', referredBy)

      await supabase.from('notifications').insert({
        user_id: referredBy,
        title: 'Referral bonus! 🎉',
        message: `You earned ${points} points because a friend signed up using your referral code.`,
        type: 'referral',
        is_read: false,
      })
    }

    if (formData.interests?.length > 0) {
      await supabase
        .from('user_interests')
        .insert(formData.interests.map((interest: string) => ({
          user_id: authData.user!.id,
          interest,
        })))
    }

    return NextResponse.json({ success: true })
  }

  if (type === 'organiser') {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.contactName,
          account_type: 'organiser',
        }
      }
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    if (!authData.user) return NextResponse.json({ error: 'Something went wrong' }, { status: 400 })

    const { error: orgError } = await supabase
      .from('organisers')
      .insert({
        id: authData.user.id,
        org_name: formData.orgName,
        contact_name: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        description: formData.description,
        is_verified: false,
        is_active: false,
      })

    if (orgError) return NextResponse.json({ error: orgError.message }, { status: 400 })

    if (formData.eventTypes?.length > 0) {
      await supabase
        .from('organiser_event_types')
        .insert(formData.eventTypes.map((type: string) => ({
          organiser_id: authData.user!.id,
          event_type: type,
        })))
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
}
