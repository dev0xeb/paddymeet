import { createClient } from '@/lib/supabase-server'
import { sendTicketConfirmationEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { reference, event_id, ticket_type_id, quantity, user_id, discount_applied, promo_code } = body

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
    })
    .select()
    .single()

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

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 400 })
  }

  // Create tickets
  const tickets = []
  for (let i = 0; i < quantity; i++) {
    tickets.push({
      ticket_type_id,
      event_id,
      user_id,
      ticket_code: `PM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      status: 'active',
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
    // No groups yet — create main event group automatically
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

  // Send confirmation email
  const { data: emailEvent } = await supabase
    .from('events')
    .select('title, event_date, start_time, venue_name')
    .eq('id', event_id)
    .single()

  const { data: emailUser } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user_id)
    .single()

  const { data: emailTicketType } = await supabase
    .from('ticket_types')
    .select('name')
    .eq('id', ticket_type_id)
    .single()

  if (emailUser?.email && createdTickets && createdTickets.length > 0) {
    await sendTicketConfirmationEmail({
      to: emailUser.email,
      userName: emailUser.full_name?.split(' ')[0] || 'there',
      eventTitle: emailEvent?.title || 'Your event',
      eventDate: emailEvent?.event_date
        ? new Date(emailEvent.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        : '',
      eventTime: emailEvent?.start_time ? emailEvent.start_time.slice(0, 5) : '',
      venueName: emailEvent?.venue_name || '',
      ticketCode: createdTickets[0].ticket_code,
      ticketTypeName: emailTicketType?.name || 'Ticket',
    })
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