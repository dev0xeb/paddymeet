import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: organiser } = await supabase
    .from('organisers')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!organiser) {
    return NextResponse.json({ error: 'Organiser account not found' }, { status: 404 })
  }

  const body = await request.json()
  const { eventData, ticketTypes } = body

  if (!eventData?.title || !eventData?.event_type || !eventData?.event_date || !eventData?.start_time || !eventData?.venue_name || !eventData?.city || !eventData?.state) {
    return NextResponse.json({ error: 'Missing required event fields' }, { status: 400 })
  }

  // Nightlife events routinely run past midnight (e.g. 9pm to 6am the next
  // day) — there's no separate end_date field, so an end_time earlier than
  // start_time is understood to roll into the day after event_date, not an
  // error. Only reject a genuine zero-duration event (identical times).
  if (eventData.end_time && eventData.end_time === eventData.start_time) {
    return NextResponse.json({ error: 'End time must be different from start time' }, { status: 400 })
  }

  if (eventData.capacity !== undefined && eventData.capacity !== null && (typeof eventData.capacity !== 'number' || eventData.capacity < 0)) {
    return NextResponse.json({ error: 'Capacity must be a positive number' }, { status: 400 })
  }

  if (eventData.age_restriction !== undefined && (typeof eventData.age_restriction !== 'number' || eventData.age_restriction < 0)) {
    return NextResponse.json({ error: 'Age restriction must be a positive number' }, { status: 400 })
  }

  if (!eventData.is_free) {
    if (!Array.isArray(ticketTypes) || ticketTypes.length === 0) {
      return NextResponse.json({ error: 'At least one ticket type is required for a paid event' }, { status: 400 })
    }
    for (const ticket of ticketTypes) {
      if (typeof ticket.price !== 'number' || ticket.price < 0) {
        return NextResponse.json({ error: `Ticket type "${ticket.name || ''}" has an invalid price` }, { status: 400 })
      }
      if (typeof ticket.quantity !== 'number' || ticket.quantity < 1) {
        return NextResponse.json({ error: `Ticket type "${ticket.name || ''}" has an invalid quantity` }, { status: 400 })
      }
      if (ticket.is_group_ticket && (typeof ticket.group_size !== 'number' || ticket.group_size < 2)) {
        return NextResponse.json({ error: `Group ticket "${ticket.name || ''}" must have a group size of at least 2` }, { status: 400 })
      }
    }
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      organiser_id: user.id,
      title: eventData.title,
      event_type: eventData.event_type,
      vibe: eventData.vibe,
      description: eventData.description,
      age_restriction: eventData.age_restriction || 0,
      dress_code: eventData.dress_code || null,
      capacity: eventData.capacity || null,
      event_date: eventData.event_date,
      start_time: eventData.start_time,
      end_time: eventData.end_time || null,
      venue_name: eventData.venue_name,
      venue_address: eventData.venue_address || null,
      city: eventData.city,
      state: eventData.state,
      cover_image_url: eventData.cover_image_url || null,
      is_free: eventData.is_free || false,
      cancellation_policy: eventData.cancellation_policy || null,
      house_rules: eventData.house_rules || null,
      website: eventData.website || null,
      social_link: eventData.social_link || null,
      is_approved: false,
      is_live: false,
    })
    .select()
    .single()

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 400 })
  }

  // Best-effort: give the event a gate-scanner passkey. Existing events were
  // backfilled by migration 005_scanner_passkey.sql, but nothing generates
  // one for events created afterward — without this, a newly created event
  // would have no way to ever get real scanner credentials. A collision on
  // the UNIQUE constraint is astronomically unlikely (16^6 space); if it
  // ever happens, or if the column doesn't exist yet on this database, this
  // silently no-ops rather than failing event creation over it.
  const scannerPasskey = Array.from({ length: 6 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('')
  await supabase.from('events').update({ scanner_passkey: scannerPasskey }).eq('id', event.id)

  // Auto-create free ticket type for free events
  if (eventData.is_free) {
    await supabase.from('ticket_types').insert({
      event_id: event.id,
      name: 'Free Entry',
      description: 'Free admission to this event',
      price: 0,
      quantity: eventData.capacity || 1000,
      quantity_sold: 0,
      is_group_ticket: false,
      group_size: 1,
    })
  }

  if (!eventData.is_free && ticketTypes && ticketTypes.length > 0) {
    const { error: ticketError } = await supabase
      .from('ticket_types')
      .insert(
        ticketTypes.map((ticket: {
          name: string
          description: string
          price: number
          quantity: number
          is_group_ticket: boolean
          group_size: number
          group_deadline?: string
        }) => ({
          event_id: event.id,
          name: ticket.name,
          description: ticket.description || null,
          price: ticket.price,
          quantity: ticket.quantity,
          quantity_sold: 0,
          is_group_ticket: ticket.is_group_ticket || false,
          group_size: ticket.is_group_ticket ? ticket.group_size : 1,
          group_deadline: ticket.is_group_ticket && ticket.group_deadline ? ticket.group_deadline : null,
        }))
      )

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ success: true, event_id: event.id })
}