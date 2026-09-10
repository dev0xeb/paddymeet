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
    // event_id is actually an authorized scanner for it.
    //
    // Two separate lookups on purpose: `scanner_passkey` may not exist on
    // this schema yet (see migration 005_scanner_passkey.sql) — selecting
    // it in the same query as `id` would fail the whole query and lock out
    // the event-ID fallback too. Selecting `id` alone never fails, and the
    // second query's failure (if the column is missing) safely resolves to
    // "no match" instead of an error.
    const { data: eventById } = await adminClient
      .from('events')
      .select('id')
      .eq('id', event_id)
      .maybeSingle()

    if (!eventById) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    }

    const cleanPasskey = passkey.trim().toUpperCase()
    let passkeyValid = eventById.id.toUpperCase() === cleanPasskey

    if (!passkeyValid) {
      const { data: eventByPasskey } = await adminClient
        .from('events')
        .select('id')
        .eq('id', event_id)
        .eq('scanner_passkey', cleanPasskey)
        .maybeSingle()
      passkeyValid = !!eventByPasskey
    }

    if (!passkeyValid) {
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
