import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { event_id, name, description, vibe, group_type, ticket_type_id, max_members, gender_preference, min_trust_score } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
  if (!event_id) return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })

  // Check user has a ticket for this event
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id')
    .eq('event_id', event_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!ticket) {
    return NextResponse.json({ error: 'You need a ticket to create a group for this event' }, { status: 403 })
  }

  // If ticket group, check user has that ticket type
  if (group_type === 'ticket' && ticket_type_id) {
    const { data: specificTicket } = await supabase
      .from('tickets')
      .select('id')
      .eq('event_id', event_id)
      .eq('user_id', user.id)
      .eq('ticket_type_id', ticket_type_id)
      .eq('status', 'active')
      .single()

    if (!specificTicket) {
      return NextResponse.json({ error: 'You need the specified ticket type to create this group' }, { status: 403 })
    }
  }

  // Create the group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      event_id,
      name: name.trim(),
      description: description?.trim() || null,
      vibe: vibe || null,
      group_type,
      ticket_type_id: group_type === 'ticket' ? ticket_type_id : null,
      max_members: max_members || 20,
      gender_preference: gender_preference || 'any',
      min_trust_score: min_trust_score || 0,
      creator_id: user.id,
      is_active: true,
      is_merged: false,
    })
    .select()
    .single()

  if (groupError) return NextResponse.json({ error: groupError.message }, { status: 400 })

  // Add creator as first member with admin role
  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'admin',
  })

  return NextResponse.json({ success: true, group })
}