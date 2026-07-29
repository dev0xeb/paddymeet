import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: organiser } = await supabase
    .from('organisers')
    .select('id')
    .eq('id', user.id)
    .single()
  if (!organiser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { ticket_code, event_id } = body

  if (!ticket_code) return NextResponse.json({ error: 'No ticket code provided' }, { status: 400 })

  // Look up the ticket
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*, events(title, organiser_id), ticket_types(name), users(username, full_name)')
    .eq('ticket_code', ticket_code.trim().toUpperCase())
    .single()

  if (error || !ticket) {
    return NextResponse.json({ valid: false, reason: 'Ticket not found', status: 'invalid' })
  }

  // Check the ticket belongs to one of this organiser's events
  const ticketEvent = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events
  if (ticketEvent?.organiser_id !== user.id) {
    return NextResponse.json({ valid: false, reason: 'This ticket is not for your event', status: 'invalid' })
  }

  // If event_id provided, check it matches
  if (event_id && ticket.event_id !== event_id) {
    return NextResponse.json({ valid: false, reason: 'This ticket is for a different event', status: 'wrong_event' })
  }

  // Check ticket status
  if (ticket.status === 'used') {
    return NextResponse.json({
      valid: false,
      reason: 'Ticket already used',
      status: 'used',
      attendee_name: ticket.attendee_name,
      ticket_type: (Array.isArray(ticket.ticket_types) ? ticket.ticket_types[0] : ticket.ticket_types)?.name,
      event_title: ticketEvent?.title,
      marked_used_at: ticket.attendance_marked_at,
    })
  }

  if (ticket.status === 'cancelled') {
    return NextResponse.json({ valid: false, reason: 'Ticket has been cancelled', status: 'cancelled' })
  }

  // Valid — mark as used
  await supabase
    .from('tickets')
    .update({
      status: 'used',
      attended: true,
      attendance_marked_at: new Date().toISOString(),
    })
    .eq('id', ticket.id)

  const ticketType = Array.isArray(ticket.ticket_types) ? ticket.ticket_types[0] : ticket.ticket_types
  const ticketUser = Array.isArray(ticket.users) ? ticket.users[0] : ticket.users

  return NextResponse.json({
    valid: true,
    status: 'valid',
    ticket_code: ticket.ticket_code,
    attendee_name: ticket.attendee_name || ticketUser?.full_name || ticketUser?.username || 'Guest',
    ticket_type: ticketType?.name,
    event_title: ticketEvent?.title,
  })
}