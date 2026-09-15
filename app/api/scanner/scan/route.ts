import { createAdminClient } from '@/lib/supabase-admin'
import { validateAndCheckInTicket } from '@/lib/ticketScan'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticket_code, event_id, passkey } = body

    if (!ticket_code?.trim() || !event_id) {
      return NextResponse.json({ error: 'Ticket code and Event ID are required' }, { status: 400 })
    }

    if (!passkey?.trim()) {
      return NextResponse.json({ error: 'Scanner session expired. Please log in again.' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Re-verify the passkey on every scan — the frontend only checks it once
    // at login, but the API must not trust that a caller who knows an
    // event_id is actually an authorized scanner for it. This used to also
    // accept the raw event ID as a valid passkey — but an event's ID is
    // public (it's the event page URL), so that let anyone who viewed a
    // public event page check tickets in for it. Passkey match only, now.
    const cleanPasskey = passkey.trim().toUpperCase()
    const { data: eventByPasskey } = await adminClient
      .from('events')
      .select('id')
      .eq('id', event_id)
      .eq('scanner_passkey', cleanPasskey)
      .maybeSingle()

    if (!eventByPasskey) {
      return NextResponse.json({ error: 'Invalid scanner passkey for this event.' }, { status: 401 })
    }

    const result = await validateAndCheckInTicket({
      supabase: adminClient,
      ticketCode: ticket_code,
      eventId: event_id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Scan processing error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
