import { createClient } from '@/lib/supabase-server'
import { sendTicketEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

interface AttendeeInput {
  name: string
  email: string
  phone: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const {
    reference, event_id, ticket_type_id, quantity, user_id,
    discount_applied, promo_code, buyer_name, buyer_phone, attendees,
    reservation_id,
  } = body

  // Verify payment with Paystack
  const verifyResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  )
  const verifyData = await verifyResponse.json()

  if (!verifyData.status || verifyData.data.status !== 'success') {
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
  }

  const amountPaid = verifyData.data.amount / 100

  // Idempotency check: if webhook already fulfilled this payment, return the created tickets
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, payment_status')
    .eq('payment_reference', reference)
    .maybeSingle()

  if (existingOrder && existingOrder.payment_status === 'completed') {
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', event_id)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(quantity)

    return NextResponse.json({
      success: true,
      order_id: existingOrder.id,
      tickets: existingTickets || [],
    })
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id,
      event_id,
      amount: amountPaid,
      service_fee: Math.round(amountPaid * 0.05),
      total_paid: amountPaid,
      payment_method: 'paystack',
      payment_reference: reference,
      payment_status: 'completed',
      discount_applied: discount_applied || 0,
      promo_code_used: promo_code || null,
      buyer_name: buyer_name || null,
      buyer_phone: buyer_phone || null,
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 400 })
  }

  // Reset referral discount after use
  if (discount_applied > 0) {
    await supabase
      .from('users')
      .update({ referral_discount_percent: 0 })
      .eq('id', user_id)
  }

  // Increment promo code usage
  if (promo_code) {
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('uses_count')
      .eq('code', promo_code)
      .single()

    if (promo) {
      await supabase
        .from('promo_codes')
        .update({ uses_count: (promo.uses_count || 0) + 1 })
        .eq('code', promo_code)
    }
  }

  const attendeeList: AttendeeInput[] = attendees && attendees.length > 0
    ? attendees
    : Array.from({ length: quantity }, () => ({ name: buyer_name || '', email: '', phone: buyer_phone || '' }))

  // Create tickets, one per attendee
  const tickets = []
  for (let i = 0; i < quantity; i++) {
    const attendee = attendeeList[i] || attendeeList[0]
    tickets.push({
      ticket_type_id,
      event_id,
      user_id,
      ticket_code: `PM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      status: 'active',
      attendee_name: attendee?.name || buyer_name || null,
      attendee_email: attendee?.email || null,
      attendee_phone: attendee?.phone || buyer_phone || null,
    })
  }

  const { data: createdTickets, error: ticketError } = await supabase
    .from('tickets')
    .insert(tickets)
    .select()

  if (ticketError) {
    return NextResponse.json({ error: ticketError.message }, { status: 400 })
  }

  // Increment tickets sold
  await supabase.rpc('increment_tickets_sold', {
    ticket_type_id,
    amount: quantity,
  })

  // Convert temporary reservation to completed status
  if (reservation_id && !reservation_id.startsWith('res-soft-')) {
    await supabase
      .from('ticket_reservations')
      .update({ status: 'converted' })
      .eq('id', reservation_id)
  }

  // Auto-add user to event groups
  const { data: eventGroups } = await supabase
    .from('groups')
    .select('id, group_type')
    .eq('event_id', event_id)
    .eq('is_active', true)

  if (eventGroups && eventGroups.length > 0) {
    for (const group of eventGroups) {
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user_id)
        .single()
      if (!existing) {
        await supabase.from('group_members').insert({
          group_id: group.id,
          user_id,
          role: 'member',
        })
      }
    }
  } else {
    const { data: event } = await supabase
      .from('events')
      .select('title')
      .eq('id', event_id)
      .single()

    const { data: newGroup } = await supabase
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
      await supabase.from('group_members').insert({
        group_id: newGroup.id,
        user_id,
        role: 'member',
      })
    }
  }

  // Send ticket confirmation notification
  await supabase
    .from('notifications')
    .insert({
      user_id,
      title: 'Ticket confirmed! 🎉',
      message: 'Your ticket has been confirmed. You have also been added to the event group. Check your dashboard to view it.',
      type: 'ticket',
      is_read: false,
    })

  // Send emails — group tickets by destination email
  if (createdTickets && createdTickets.length > 0) {
    const { data: emailEvent } = await supabase
      .from('events')
      .select('title, event_date, start_time, venue_name')
      .eq('id', event_id)
      .single()

    const { data: emailUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single()

    const { data: emailTicketType } = await supabase
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
        ticketTypeName: emailTicketType?.name || 'Ticket',
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
  await awardReferralDiscount(supabase, user_id)

  return NextResponse.json({
    success: true,
    order_id: order.id,
    tickets: createdTickets,
  })
}

async function awardReferralDiscount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user_id: string
) {
  const { data: profile } = await supabase
    .from('users')
    .select('referred_by, referral_converted')
    .eq('id', user_id)
    .single()

  if (!profile?.referred_by || profile.referral_converted) return

  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user_id)

  if ((count ?? 0) > 1) return

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('referral_discount_percent')
    .eq('id', 1)
    .single()

  const discount = settings?.referral_discount_percent ?? 10

  await supabase
    .from('users')
    .update({ referral_discount_percent: discount, referral_converted: true })
    .eq('id', profile.referred_by)

  await supabase
    .from('users')
    .update({ referral_converted: true })
    .eq('id', user_id)

  await supabase.from('notifications').insert({
    user_id: profile.referred_by,
    title: 'Referral reward unlocked! 🎁',
    message: `A friend you referred just got their first ticket. You have earned a ${discount}% discount on your next ticket purchase.`,
    type: 'referral',
    is_read: false,
  })
}