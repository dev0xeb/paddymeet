import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendTicketEmail } from '@/lib/email'
import { generateTicketCode } from '@/lib/ticketCode'
import { awardReferralDiscount } from '@/lib/referral'
import { NextRequest, NextResponse } from 'next/server'

interface AttendeeInput {
  name: string
  email: string
  phone: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { event_id, ticket_type_id, quantity, user_id, buyer_name, buyer_phone, attendees } = body

  if (user_id !== user.id) {
    return NextResponse.json({ error: 'You can only claim tickets for your own account' }, { status: 403 })
  }

  if (!event_id || !ticket_type_id || !quantity) {
    return NextResponse.json({ error: 'event_id, ticket_type_id and quantity are required' }, { status: 400 })
  }

  // This route's writes need the admin client — the buyer's own session
  // can't write ticket_types/tickets/groups under RLS (same reason
  // /api/tickets/verify and the Paystack webhook use it), and this route
  // previously used the session client throughout, meaning its capacity
  // compare-and-swap below silently matched 0 rows and claim-free was
  // failing for every user on the first attempt.
  const adminClient = createAdminClient()

  // This route bypasses Paystack entirely, so it must independently verify
  // the ticket is actually free — otherwise it's an unauthenticated way to
  // mint paid tickets for nothing.
  const { data: ticketType } = await adminClient
    .from('ticket_types')
    .select('price, quantity, quantity_sold')
    .eq('id', ticket_type_id)
    .eq('event_id', event_id)
    .maybeSingle()

  if (!ticketType || ticketType.price > 0) {
    return NextResponse.json({ error: 'This ticket type requires payment and cannot be claimed for free' }, { status: 400 })
  }

  // Reject claims for an event that isn't actually approved and live yet —
  // every other ticket-issuing path already re-checks this; this route was
  // missing it, meaning anyone who knew a pending event's free ticket_type
  // id could claim a confirmed ticket for an event admin never approved.
  const { data: eventForClaim } = await adminClient
    .from('events')
    .select('is_approved, is_live')
    .eq('id', event_id)
    .single()

  if (!eventForClaim?.is_approved || !eventForClaim?.is_live) {
    return NextResponse.json({ error: 'This event is not open for ticket sales yet.' }, { status: 400 })
  }

  // Atomic capacity check — same guarded-update pattern as the paid path
  // (app/api/tickets/verify/route.ts) so two concurrent claims can't both
  // succeed past the last free ticket.
  const currentSold = ticketType.quantity_sold || 0
  if (currentSold + quantity > ticketType.quantity) {
    return NextResponse.json({ error: 'No free tickets remaining for this ticket type.' }, { status: 409 })
  }

  const { data: capacityRows, error: capacityError } = await adminClient
    .from('ticket_types')
    .update({ quantity_sold: currentSold + quantity })
    .eq('id', ticket_type_id)
    .eq('quantity_sold', currentSold)
    .select('id')

  if (capacityError || !capacityRows || capacityRows.length === 0) {
    return NextResponse.json({
      error: 'These free tickets were just claimed by someone else. Please try again.',
    }, { status: 409 })
  }

  const attendeeList: AttendeeInput[] = attendees && attendees.length > 0
    ? attendees
    : Array.from({ length: quantity }, () => ({ name: buyer_name || '', email: '', phone: buyer_phone || '' }))

  // Create free tickets, one per attendee
  const tickets = []
  for (let i = 0; i < quantity; i++) {
    const attendee = attendeeList[i] || attendeeList[0]
    tickets.push({
      ticket_type_id,
      event_id,
      user_id,
      ticket_code: generateTicketCode('PM-FREE'),
      status: 'active',
      attendee_name: attendee?.name || buyer_name || null,
      attendee_email: attendee?.email || null,
      attendee_phone: attendee?.phone || buyer_phone || null,
    })
  }

  const { data: createdTickets, error } = await adminClient
    .from('tickets')
    .insert(tickets)
    .select()

  if (error) {
    // Give back the capacity we just reserved — no tickets were actually created.
    await adminClient
      .from('ticket_types')
      .update({ quantity_sold: currentSold })
      .eq('id', ticket_type_id)
      .eq('quantity_sold', currentSold + quantity)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Auto-add user to event groups
  const { data: eventGroups } = await adminClient
    .from('groups')
    .select('id, group_type')
    .eq('event_id', event_id)
    .eq('is_active', true)

  if (eventGroups && eventGroups.length > 0) {
    for (const group of eventGroups) {
      const { data: existing } = await adminClient
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user_id)
        .limit(1)
      if ((existing?.length ?? 0) === 0) {
        await adminClient.from('group_members').insert({
          group_id: group.id,
          user_id,
          role: 'member',
        })
      }
    }
  } else {
    const { data: event } = await adminClient
      .from('events')
      .select('title')
      .eq('id', event_id)
      .single()

    const { data: newGroup } = await adminClient
      .from('groups')
      .insert({
        event_id,
        name: `${event?.title || 'Event'} Group`,
        group_type: 'main',
        creator_id: user_id,
        is_active: true,
        is_merged: false,
      })
      .select()
      .single()

    if (newGroup) {
      await adminClient.from('group_members').insert({
        group_id: newGroup.id,
        user_id,
        role: 'member',
      })
    }
  }

  // Send confirmation notification
  await adminClient
    .from('notifications')
    .insert({
      user_id,
      title: 'Free ticket confirmed! 🎉',
      message: 'Your free ticket has been confirmed. You have also been added to the event group. See you there!',
      type: 'ticket',
      is_read: false,
    })

  // Send emails — group tickets by destination email
  if (createdTickets && createdTickets.length > 0) {
    const { data: emailEvent } = await adminClient
      .from('events')
      .select('title, event_date, start_time, venue_name')
      .eq('id', event_id)
      .single()

    const { data: emailUser } = await adminClient
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single()

    const { data: emailTicketType } = await adminClient
      .from('ticket_types')
      .select('name')
      .eq('id', ticket_type_id)
      .single()

    const buyerEmail = emailUser?.email
    const eventDateStr = emailEvent?.event_date
      ? new Date(emailEvent.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      : ''
    const eventTimeStr = emailEvent?.start_time ? emailEvent.start_time.slice(0, 5) : ''

    const ticketsByEmail: Record<string, { ticketCode: string, ticketTypeName: string, attendeeName?: string }[]> = {}
    createdTickets.forEach((t) => {
      const destEmail = t.attendee_email || buyerEmail
      if (!destEmail) return
      if (!ticketsByEmail[destEmail]) ticketsByEmail[destEmail] = []
      ticketsByEmail[destEmail].push({
        ticketCode: t.ticket_code,
        ticketTypeName: emailTicketType?.name || 'Free Entry',
        attendeeName: t.attendee_name || undefined,
      })
    })

    for (const [destEmail, ticketGroup] of Object.entries(ticketsByEmail)) {
      const recipientName = destEmail === buyerEmail ? (buyer_name || 'there') : (ticketGroup[0].attendeeName || 'there')
      await sendTicketEmail({
        to: destEmail,
        recipientName,
        eventTitle: emailEvent?.title || 'Your event',
        eventDate: eventDateStr,
        eventTime: eventTimeStr,
        venueName: emailEvent?.venue_name || '',
        tickets: ticketGroup,
      })
    }
  }

  // Referral discount trigger — check if this is the user's first ticket
  await awardReferralDiscount(adminClient, user_id)

  return NextResponse.json({ success: true, tickets: createdTickets })
}