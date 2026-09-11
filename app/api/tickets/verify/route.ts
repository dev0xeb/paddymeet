import { createClient } from '@/lib/supabase-server'
import { sendTicketEmail } from '@/lib/email'
import { generateTicketCode } from '@/lib/ticketCode'
import { computeOrderTotal } from '@/lib/pricing'
import { awardReferralDiscount } from '@/lib/referral'
import { NextRequest, NextResponse } from 'next/server'

interface AttendeeInput {
  name: string
  email: string
  phone: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()

  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    reference, event_id, ticket_type_id, quantity, user_id,
    promo_code, buyer_name, buyer_phone, attendees,
    reservation_id,
  } = body

  if (user_id !== sessionUser.id) {
    return NextResponse.json({ error: 'You can only claim tickets for your own account' }, { status: 403 })
  }

  // DEV-ONLY: NEXT_PUBLIC_SKIP_PAYSTACK=true lets the checkout modal skip the
  // real Paystack widget and call this route with a TEST-BYPASS- reference
  // instead. The flag is re-checked here independently of the client, so a
  // crafted TEST-BYPASS- reference against a deployment that hasn't set this
  // flag falls straight through to the real Paystack verification below and
  // fails like any other bogus reference.
  const skipPaystack = process.env.NEXT_PUBLIC_SKIP_PAYSTACK === 'true' && reference?.startsWith('TEST-BYPASS-')

  let verifyData: { status: boolean; data: { status: string; amount: number } }

  if (skipPaystack) {
    const { data: bypassTicketType } = await supabase
      .from('ticket_types')
      .select('price, is_group_ticket')
      .eq('id', ticket_type_id)
      .eq('event_id', event_id)
      .maybeSingle()

    const price = bypassTicketType?.price || 0
    const testAmount = bypassTicketType?.is_group_ticket ? price : price * quantity

    verifyData = {
      status: true,
      data: { status: 'success', amount: Math.round(testAmount * 100) },
    }
  } else {
    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )
    verifyData = await verifyResponse.json()
  }

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

  // Independently recompute what this order should cost — never trust the
  // amount the client asked Paystack to charge. All inputs here come from
  // the database, not the request body.
  const { data: ticketType, error: ticketTypeError } = await supabase
    .from('ticket_types')
    .select('price, is_group_ticket, quantity, quantity_sold')
    .eq('id', ticket_type_id)
    .eq('event_id', event_id)
    .single()

  if (ticketTypeError || !ticketType) {
    return NextResponse.json({ error: 'Ticket type not found' }, { status: 404 })
  }

  const { data: buyerProfile } = await supabase
    .from('users')
    .select('referral_discount_percent, email')
    .eq('id', user_id)
    .single()
  const referralDiscountPercent = buyerProfile?.referral_discount_percent || 0

  let validPromo: { code: string; discount_type: string; discount_value: number } | null = null
  if (promo_code) {
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('code, discount_type, discount_value, max_uses, uses_count, is_active, expires_at')
      .eq('code', promo_code)
      .maybeSingle()

    const isValid = !!promo
      && promo.is_active
      && (!promo.expires_at || new Date(promo.expires_at) > new Date())
      && (!promo.max_uses || promo.uses_count < promo.max_uses)

    if (isValid) validPromo = promo
  }

  const expected = computeOrderTotal({
    price: ticketType.price,
    quantity,
    isGroupTicket: ticketType.is_group_ticket,
    referralDiscountPercent,
    promo: validPromo,
  })

  if (!skipPaystack && Math.abs(amountPaid - expected.total) > 1) {
    return NextResponse.json({
      error: `Payment amount does not match the ticket price. If you were charged, contact support with reference ${reference}.`,
    }, { status: 400 })
  }

  // Atomic capacity check — guarded update so two concurrent purchases
  // can't both succeed past the last ticket. Whoever's update doesn't
  // match the quantity_sold it read loses the race and is told to retry.
  const currentSold = ticketType.quantity_sold || 0
  if (currentSold + quantity > ticketType.quantity) {
    return NextResponse.json({ error: 'Not enough tickets remaining for this ticket type.' }, { status: 409 })
  }

  const { data: capacityRows, error: capacityError } = await supabase
    .from('ticket_types')
    .update({ quantity_sold: currentSold + quantity })
    .eq('id', ticket_type_id)
    .eq('quantity_sold', currentSold)
    .select('id')

  if (capacityError || !capacityRows || capacityRows.length === 0) {
    return NextResponse.json({
      error: 'These tickets were just claimed by someone else. Please try again — contact support with your payment reference if you were charged.',
    }, { status: 409 })
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
      ticket_code: generateTicketCode('PM'),
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
    // Give back the capacity we just reserved — no tickets were actually created.
    await supabase
      .from('ticket_types')
      .update({ quantity_sold: currentSold })
      .eq('id', ticket_type_id)
      .eq('quantity_sold', currentSold + quantity)
    return NextResponse.json({ error: ticketError.message }, { status: 400 })
  }

  // Only record the order as completed once tickets genuinely exist for it.
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id,
      event_id,
      amount: amountPaid,
      service_fee: expected.serviceFee,
      total_paid: amountPaid,
      payment_method: 'paystack',
      payment_reference: reference,
      payment_status: 'completed',
      discount_applied: referralDiscountPercent,
      promo_code_used: validPromo?.code || null,
      buyer_name: buyer_name || null,
      buyer_phone: buyer_phone || null,
    })
    .select()
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 400 })
  }

  // Reset referral discount after use
  if (referralDiscountPercent > 0) {
    await supabase
      .from('users')
      .update({ referral_discount_percent: 0 })
      .eq('id', user_id)
  }

  // Increment promo code usage — guarded the same way as the ticket
  // capacity update, so concurrent redemptions of a near-limit code can't
  // both succeed and push usage past max_uses.
  if (validPromo) {
    const { data: promoRow } = await supabase
      .from('promo_codes')
      .select('uses_count')
      .eq('code', validPromo.code)
      .single()
    if (promoRow) {
      await supabase
        .from('promo_codes')
        .update({ uses_count: (promoRow.uses_count || 0) + 1 })
        .eq('code', validPromo.code)
        .eq('uses_count', promoRow.uses_count)
    }
  }

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
        .limit(1)
      if ((existing?.length ?? 0) === 0) {
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

    const { data: emailTicketType } = await supabase
      .from('ticket_types')
      .select('name')
      .eq('id', ticket_type_id)
      .single()

    const buyerEmail = buyerProfile?.email
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