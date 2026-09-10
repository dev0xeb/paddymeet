import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/groups/squads/join
 * Join an open squad for an event.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to join a squad' }, { status: 401 })
  }

  const body = await request.json()
  const { squad_id } = body

  if (!squad_id) {
    return NextResponse.json({ error: 'squad_id is required' }, { status: 400 })
  }

  // 1. Fetch squad details & current members
  const { data: squad, error: squadError } = await supabase
    .from('groups')
    .select('id, name, event_id, max_members, is_active, group_members(id, user_id)')
    .eq('id', squad_id)
    .single()

  if (squadError || !squad) {
    return NextResponse.json({ error: 'Squad not found' }, { status: 404 })
  }

  const members = squad.group_members || []
  const maxCapacity = squad.max_members || 6

  // 2. Check if user already in squad
  const alreadyMember = members.some((m: { user_id: string }) => m.user_id === user.id)
  if (alreadyMember) {
    return NextResponse.json({ success: true, message: 'Already a member of this squad', squad_id })
  }

  // 3. Check capacity limit
  if (members.length >= maxCapacity) {
    return NextResponse.json({ error: `This squad is already full (${maxCapacity}/${maxCapacity} spots taken).` }, { status: 400 })
  }

  // 4. Check if user holds a ticket for this event
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id')
    .eq('event_id', squad.event_id)
    .eq('user_id', user.id)
    .maybeSingle()

  // 5. Insert membership
  const { error: joinError } = await supabase
    .from('group_members')
    .insert({
      group_id: squad_id,
      user_id: user.id,
      role: 'member',
      payment_status: ticket ? 'paid' : 'pending',
    })

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 })
  }

  // 6. Fetch user profile to post an announcement
  const { data: profile } = await supabase
    .from('users')
    .select('username, full_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.username || profile?.full_name || 'A new member'

  // Post system join message
  await supabase.from('group_messages').insert({
    group_id: squad_id,
    user_id: user.id,
    message: `👋 ${displayName} joined the squad! (${members.length + 1}/${maxCapacity})`,
  })

  return NextResponse.json({
    success: true,
    squad_id,
    new_member_count: members.length + 1,
    is_full: members.length + 1 >= maxCapacity,
  })
}
