import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*, ticket_types(*)')
    .eq('id', groupId)
    .single()

  if (groupError || !group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  if (group.status !== 'recruiting') {
    return NextResponse.json({ error: 'This group is no longer accepting new members' }, { status: 400 })
  }

  if (group.payment_deadline && new Date(group.payment_deadline) < new Date()) {
    return NextResponse.json({ error: 'Sign-ups for this group have closed' }, { status: 400 })
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'You are already in this group' }, { status: 400 })
  }

  // Check current member count
  const { count: memberCount } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)

  if ((memberCount ?? 0) >= group.max_members) {
    return NextResponse.json({ error: 'This group is already full' }, { status: 400 })
  }

  const ticketType = Array.isArray(group.ticket_types) ? group.ticket_types[0] : group.ticket_types

  if ((ticketType?.quantity_sold || 0) >= (ticketType?.quantity || 0)) {
    return NextResponse.json({ error: 'No more slots available for this ticket type' }, { status: 400 })
  }

  // Reserve a slot at the ticket type level too (each member's eventual ticket also draws from the pool)
  const { error: reserveError } = await supabase
    .from('ticket_types')
    .update({ quantity_sold: (ticketType.quantity_sold || 0) + 1 })
    .eq('id', ticketType.id)
    .eq('quantity_sold', ticketType.quantity_sold || 0)

  if (reserveError) {
    return NextResponse.json({ error: 'Could not reserve a slot. Please try again.' }, { status: 400 })
  }

  // Add as pending member
  const { error: memberError } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id: user.id,
    role: 'member',
    payment_status: 'pending',
    amount_paid: 0,
  })

  if (memberError) {
    await supabase.from('ticket_types').update({ quantity_sold: ticketType.quantity_sold || 0 }).eq('id', ticketType.id)
    return NextResponse.json({ error: memberError.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    amount_per_member: group.amount_per_member,
    needs_payment: group.amount_per_member > 0,
  })
}