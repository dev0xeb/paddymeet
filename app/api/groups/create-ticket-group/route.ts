import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // The capacity compare-and-swap below writes ticket_types under RLS,
  // which the buyer's own session can't do (same reason /api/tickets/verify
  // uses the admin client) — this was silently matching 0 rows every time,
  // so "Start a New Group" has been failing with "Could not reserve a slot"
  // for every user.
  const adminClient = createAdminClient()

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

  // Atomic, self-healing capacity check — one unit of quantity == one
  // table, regardless of group_size. Derives the real reserved-table count
  // from the groups table itself (recruiting/completed) rather than
  // trusting the cached quantity_sold column, and confirms the guarded
  // update actually matched a row before proceeding: the previous version
  // here checked only for a Postgres error, but a lost compare-and-swap
  // race (someone else reserved the last table first) updates zero rows
  // without raising one, so it silently let the request through anyway and
  // created more tables than the organiser's stated capacity allowed.
  let reserved = false
  for (let attempt = 0; attempt < 3 && !reserved; attempt++) {
    const { count: activeTables } = await adminClient
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_type_id', ticket_type_id)
      .in('status', ['recruiting', 'completed'])

    const currentSold = activeTables || 0

    if (currentSold + 1 > ticketType.quantity) {
      return NextResponse.json({ error: 'This group ticket is sold out' }, { status: 400 })
    }

    const { data: reserveRows } = await adminClient
      .from('ticket_types')
      .update({ quantity_sold: currentSold + 1 })
      .eq('id', ticket_type_id)
      .eq('quantity_sold', currentSold)
      .select('id')

    reserved = !!reserveRows && reserveRows.length > 0
  }

  if (!reserved) {
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
    await adminClient.from('ticket_types').update({ quantity_sold: ticketType.quantity_sold || 0 }).eq('id', ticket_type_id)
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