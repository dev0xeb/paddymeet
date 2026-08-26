import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticket_code, event_id } = body

    if (!ticket_code?.trim() || !event_id) {
      return NextResponse.json({ error: 'Ticket code and Event ID are required' }, { status: 400 })
    }

    const cleanCode = ticket_code.trim().toUpperCase()
    const adminClient = createAdminClient()

    // 1. Look up the ticket
    const { data: ticket, error } = await adminClient
      .from('tickets')
      .select('id, ticket_code, status, attended, attendance_marked_at, attendee_name, event_id, ticket_type_id, user_id, ticket_types(name), events(title), users(full_name, username)')
      .eq('ticket_code', cleanCode)
      .maybeSingle()

    if (error || !ticket) {
      return NextResponse.json({
        valid: false,
        status: 'not_found',
        reason: 'Invalid Ticket — Code not found in system',
      })
    }

    // 2. Verify event match
    if (ticket.event_id !== event_id) {
      return NextResponse.json({
        valid: false,
        status: 'wrong_event',
        reason: 'Ticket is for a different event',
      })
    }

    const ticketType = Array.isArray(ticket.ticket_types) ? ticket.ticket_types[0] : ticket.ticket_types
    const ticketUser = Array.isArray(ticket.users) ? ticket.users[0] : ticket.users
    const attendeeName = ticket.attendee_name || ticketUser?.full_name || ticketUser?.username || 'Guest'

    // 3. Check status
    if (ticket.status === 'used' || ticket.attended) {
      return NextResponse.json({
        valid: false,
        status: 'already_used',
        reason: 'Ticket Already Scanned',
        attendee_name: attendeeName,
        ticket_type: ticketType?.name || 'General',
        scanned_at: ticket.attendance_marked_at,
      })
    }

    if (ticket.status === 'refunded') {
      return NextResponse.json({
        valid: false,
        status: 'refunded',
        reason: 'Ticket Refunded / Voided — Entry Denied',
        attendee_name: attendeeName,
      })
    }

    if (ticket.status === 'cancelled') {
      return NextResponse.json({
        valid: false,
        status: 'cancelled',
        reason: 'Ticket Cancelled — Entry Denied',
        attendee_name: attendeeName,
      })
    }

    // 4. Valid ticket — Mark as checked in
    const markedAt = new Date().toISOString()
    await adminClient
      .from('tickets')
      .update({
        status: 'used',
        attended: true,
        attendance_marked_at: markedAt,
      })
      .eq('id', ticket.id)

    return NextResponse.json({
      valid: true,
      status: 'valid',
      ticket_code: ticket.ticket_code,
      attendee_name: attendeeName,
      ticket_type: ticketType?.name || 'General',
      checked_in_at: markedAt,
    })
  } catch (error) {
    console.error('Scan processing error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
