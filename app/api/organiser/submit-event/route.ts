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