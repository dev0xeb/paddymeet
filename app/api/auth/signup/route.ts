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
      })

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

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
