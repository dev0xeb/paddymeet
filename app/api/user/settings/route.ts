import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: interests } = await supabase
    .from('user_interests')
    .select('interest')
    .eq('user_id', user.id)

  return NextResponse.json({ profile, interests })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { full_name, phone, city, state, gender, avatar_url, interests } = body

  const { error: profileError } = await supabase
    .from('users')
    .update({ full_name, phone, city, state, gender, avatar_url })
    .eq('id', user.id)

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  if (interests !== undefined) {
    await supabase.from('user_interests').delete().eq('user_id', user.id)
    if (interests.length > 0) {
      await supabase.from('user_interests').insert(
        interests.map((interest: string) => ({ user_id: user.id, interest }))
      )
    }
  }

  return NextResponse.json({ success: true })
}