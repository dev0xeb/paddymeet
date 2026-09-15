import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { passkey } = body

    if (!passkey?.trim()) {
      return NextResponse.json({ error: 'Passkey is required' }, { status: 400 })
    }

    const cleanKey = passkey.trim().toUpperCase()
    const adminClient = createAdminClient()

    const eventColumns = 'id, title, event_date, start_time, venue_name, city, is_approved, is_live'

    // Match by dedicated scanner passkey only. This used to also accept the
    // raw event ID as a passkey — but an event's ID is public (it's the
    // event page URL), so that fallback let anyone who viewed a public
    // event page authenticate as its door scanner and check tickets in.
    // If this event was created before migration 005_scanner_passkey.sql
    // was applied (or before that migration's backfill ran), it has no
    // passkey yet and simply can't be scanned into until it gets one.
    const { data: event } = await adminClient
      .from('events')
      .select(eventColumns)
      .eq('scanner_passkey', cleanKey)
      .maybeSingle()

    if (!event) {
      return NextResponse.json({ error: 'Invalid scanner passkey. Please check with the event organizer.' }, { status: 404 })
    }

    if (!event.is_approved) {
      return NextResponse.json({ error: 'This event is not approved for live scanning.' }, { status: 403 })
    }

    // Get attendance stats for gate staff
    const { count: totalTickets } = await adminClient
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .neq('status', 'refunded')
      .neq('status', 'cancelled')

    const { count: totalCheckedIn } = await adminClient
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'used')

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        event_date: event.event_date,
        start_time: event.start_time,
        venue_name: event.venue_name,
        city: event.city,
      },
      stats: {
        total: totalTickets || 0,
        checked_in: totalCheckedIn || 0,
        remaining: Math.max(0, (totalTickets || 0) - (totalCheckedIn || 0)),
      },
    })
  } catch (error) {
    console.error('Scanner auth error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
