import type { SupabaseClient } from '@supabase/supabase-js'
import { sendCheckInEmail } from '@/lib/email'

// Gates are considered open this long before the event's official start time.
// A scan attempted earlier than this is rejected as "too early".
const GATE_OPEN_BUFFER_MS = 2 * 60 * 60 * 1000 // 2 hours

export type ScanStatus =
  | 'valid'
  | 'used'
  | 'not_found'
  | 'wrong_event'
  | 'cancelled'
  | 'refunded'
  | 'not_yet_open'

export interface ScanResult {
  valid: boolean
  status: ScanStatus
  reason?: string
  ticket_code?: string
  attendee_name?: string
  ticket_type?: string
  event_title?: string
  checked_in_at?: string
}

interface ValidateParams {
  supabase: SupabaseClient
  ticketCode: string
  /** Restrict the scan to this event (rejects tickets for any other event). */
  eventId?: string
  /** Restrict the scan to events owned by this organiser. */
  organiserId?: string
}

/**
 * Single source of truth for gate check-in: looks a ticket up by code,
 * validates it (event match, status, gate-open time window), and — if
 * valid — marks it used and fires a best-effort "you're checked in" email.
 * Shared by the passkey-based public scanner and the session-based
 * organiser scanner so both apply the exact same rules.
 */
export async function validateAndCheckInTicket({
  supabase,
  ticketCode,
  eventId,
  organiserId,
}: ValidateParams): Promise<ScanResult> {
  const cleanCode = ticketCode.trim().toUpperCase()

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      id, ticket_code, status, attended, attendance_marked_at,
      attendee_name, event_id, user_id,
      ticket_types(name),
      events(id, title, event_date, start_time, organiser_id),
      users(username, full_name, email)
    `)
    .eq('ticket_code', cleanCode)
    .maybeSingle()

  if (error || !ticket) {
    return { valid: false, status: 'not_found', reason: 'Invalid ticket — code not found in system' }
  }

  const ticketType = Array.isArray(ticket.ticket_types) ? ticket.ticket_types[0] : ticket.ticket_types
  const event = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events
  const ticketUser = Array.isArray(ticket.users) ? ticket.users[0] : ticket.users
  const attendeeName = ticket.attendee_name || ticketUser?.full_name || ticketUser?.username || 'Guest'

  if (organiserId && event?.organiser_id !== organiserId) {
    return { valid: false, status: 'wrong_event', reason: 'This ticket is not for your event' }
  }

  if (eventId && ticket.event_id !== eventId) {
    return { valid: false, status: 'wrong_event', reason: 'This ticket is for a different event', attendee_name: attendeeName }
  }

  if (ticket.status === 'used' || ticket.attended) {
    return {
      valid: false,
      status: 'used',
      reason: 'Ticket already used',
      attendee_name: attendeeName,
      ticket_type: ticketType?.name,
      event_title: event?.title,
      checked_in_at: ticket.attendance_marked_at,
    }
  }

  if (ticket.status === 'refunded') {
    return { valid: false, status: 'refunded', reason: 'Ticket refunded / voided — entry denied', attendee_name: attendeeName }
  }

  if (ticket.status === 'cancelled') {
    return { valid: false, status: 'cancelled', reason: 'Ticket cancelled — entry denied', attendee_name: attendeeName }
  }

  if (event?.event_date && event?.start_time) {
    const eventStartsAt = new Date(`${event.event_date}T${event.start_time}`)
    const gateOpensAt = new Date(eventStartsAt.getTime() - GATE_OPEN_BUFFER_MS)
    if (!Number.isNaN(gateOpensAt.getTime()) && new Date() < gateOpensAt) {
      return {
        valid: false,
        status: 'not_yet_open',
        reason: `Too early — gates open ${gateOpensAt.toLocaleString()}`,
        attendee_name: attendeeName,
        event_title: event?.title,
      }
    }
  }

  const checkedInAt = new Date().toISOString()
  await supabase
    .from('tickets')
    .update({ status: 'used', attended: true, attendance_marked_at: checkedInAt })
    .eq('id', ticket.id)

  if (ticketUser?.email) {
    sendCheckInEmail({
      to: ticketUser.email,
      recipientName: attendeeName,
      eventTitle: event?.title || 'your event',
      ticketCode: ticket.ticket_code,
      ticketTypeName: ticketType?.name || 'General',
      checkedInAt,
    }).catch((err) => console.error('Check-in email failed to send:', err))
  }

  return {
    valid: true,
    status: 'valid',
    ticket_code: ticket.ticket_code,
    attendee_name: attendeeName,
    ticket_type: ticketType?.name,
    event_title: event?.title,
    checked_in_at: checkedInAt,
  }
}
