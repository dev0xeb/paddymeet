import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { event_id, ticket_type_id, name } = body

  if (!event_id || !ticket_type_id) {
    return NextResponse.json({ error: 'Event and ticket type are required' }, { status: 400 })
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
  }

  const { data: ticketType, error: ttError } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('id', ticket_type_id)
    .single()

  if (ttError || !ticketType) {
    return NextResponse.json({ error: 'Ticket type not found' }, { status: 404 })
  }

  if (!ticketType.is_group_ticket) {
    return NextResponse.json({ error: 'This is not a group ticket type' }, { status: 400 })
  }

  if (ticketType.group_deadline && new Date(ticketType.group_deadline) < new Date()) {
    return NextResponse.json({ error: 'Group ticket sales have closed for this ticket type' }, { status: 400 })
  }

  if ((ticketType.quantity_sold || 0) >= ticketType.quantity) {
    return NextResponse.json({ error: 'This group ticket is sold out' }, { status: 400 })
  }

  // Reserve one group slot at the ticket-type level (the "table" itself)
  const { error: reserveError } = await supabase
    .from('ticket_types')
    .update({ quantity_sold: (ticketType.quantity_sold || 0) + 1 })
    .eq('id', ticket_type_id)
    .eq('quantity_sold', ticketType.quantity_sold || 0)

  if (reserveError) {
    return NextResponse.json({ error: 'Could not reserve a slot. Please try again.' }, { status: 400 })
  }

  const amountPerMember = Math.round(ticketType.price / ticketType.group_size)

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      event_id,
      name: name.trim(),
      group_type: 'ticket',
      ticket_type_id,
      max_members: ticketType.group_size,
      creator_id: user.id,
      is_active: true,
      is_merged: false,
      status: 'recruiting',
      amount_per_member: amountPerMember,
      payment_deadline: ticketType.group_deadline,
    })
    .select()
    .single()

  if (groupError) {
    await supabase.from('ticket_types').update({ quantity_sold: ticketType.quantity_sold || 0 }).eq('id', ticket_type_id)
    return NextResponse.json({ error: groupError.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    group,
    amount_per_member: amountPerMember,
    max_spots: ticketType.group_size,
    needs_payment: ticketType.price > 0,
  })
}