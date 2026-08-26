import { createAdminClient } from '@/lib/supabase-admin'
import { sendTicketEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface AttendeeInput {
  name: string
  email: string
  phone: string
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    // 1. Verify HMAC SHA-512 signature
    const secret = process.env.PAYSTACK_SECRET_KEY || ''
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')

    if (!signature || signature !== hash) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const { event, data } = payload
    const adminClient = createAdminClient()

    // 2. Handle Transfer Webhooks (Payouts reconciliation)
    if (event === 'transfer.success') {
      const transferCode = data.transfer_code || data.reference
      const reference = data.reference
      if (reference && reference.startsWith('PM-PAYOUT-')) {
        const payoutId = reference.replace('PM-PAYOUT-', '')
        await adminClient
          .from('payouts')
          .update({
            status: 'paid',
            payment_reference: transferCode,
            paid_at: new Date().toISOString(),
            note: `Disbursement confirmed via Paystack Webhook (${transferCode})`,
          })
          .eq('id', payoutId)
      }
      return NextResponse.json({ received: true, type: 'transfer_success' }, { status: 200 })
    }

    if (event === 'transfer.failed' || event === 'transfer.reversed') {
      const reference = data.reference
      if (reference && reference.startsWith('PM-PAYOUT-')) {
        const payoutId = reference.replace('PM-PAYOUT-', '')
        await adminClient
          .from('payouts')
          .update({
            status: 'failed',
            note: `Transfer failed: ${data.reason || 'Bank gateway rejected transfer'}`,
          })
          .eq('id', payoutId)
      }
      return NextResponse.json({ received: true, type: 'transfer_failed' }, { status: 200 })
    }

    if (event !== 'charge.success' || data.status !== 'success') {
      return NextResponse.json({ received: true, ignored: true }, { status: 200 })
    }

    const reference = data.reference
    const amountPaid = data.amount / 100
    const metadata = data.metadata || {}

    // 2. Check idempotency: Has this reference already been processed?
    const { data: existingOrder } = await adminClient
      .from('orders')
      .select('id, payment_status')
      .eq('payment_reference', reference)
      .maybeSingle()

    if (existingOrder && existingOrder.payment_status === 'completed') {
      return NextResponse.json({ received: true, status: 'already_processed' }, { status: 200 })
    }

    // 3. Handle Group Share Payments (if metadata.group_id is present)
    if (metadata.group_id) {
      await handleGroupPayment(adminClient, data, metadata, amountPaid, reference)
      return NextResponse.json({ received: true, type: 'group_share' }, { status: 200 })
    }

    // 4. Handle Standard Ticket Purchase
    const {
      event_id,
      ticket_type_id,
      quantity = 1,
      user_id,
      discount_applied = 0,
      promo_code = null,
      buyer_name = null,
      buyer_phone = null,
      attendees = [],
    } = metadata

    if (!event_id || !ticket_type_id) {
      // Missing essential metadata
      return NextResponse.json({ received: true, warning: 'Missing event_id or ticket_type_id' }, { status: 200 })
    }

    // Create or update order
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        user_id: user_id || null,
        event_id,
        amount: amountPaid,
        service_fee: Math.round(amountPaid * 0.05),
        total_paid: amountPaid,
        payment_method: 'paystack',
        payment_reference: reference,
        payment_status: 'completed',
        discount_applied: discount_applied || 0,
        promo_code_used: promo_code || null,
        buyer_name: buyer_name || data.customer?.first_name ? `${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`.trim() : null,
        buyer_phone: buyer_phone || data.customer?.phone || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Webhook order creation error:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Reset referral discount if applied
    if (user_id && discount_applied > 0) {
      await adminClient
        .from('users')
        .update({ referral_discount_percent: 0 })
        .eq('id', user_id)
    }

    // Increment promo code usage
    if (promo_code) {
      const { data: promo } = await adminClient
        .from('promo_codes')
        .select('uses_count')
        .eq('code', promo_code)
        .single()

      if (promo) {
        await adminClient
          .from('promo_codes')
          .update({ uses_count: (promo.uses_count || 0) + 1 })
          .eq('code', promo_code)
      }
    }

    const attendeeList: AttendeeInput[] = attendees && attendees.length > 0
      ? attendees
      : Array.from({ length: quantity }, () => ({
          name: buyer_name || '',
          email: data.customer?.email || '',
          phone: buyer_phone || '',
        }))

    // Create tickets, one per attendee
    const tickets = []
    for (let i = 0; i < quantity; i++) {
      const attendee = attendeeList[i] || attendeeList[0]
      tickets.push({
        ticket_type_id,
        event_id,
        user_id: user_id || null,
        ticket_code: `PM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        status: 'active',
        attendee_name: attendee?.name || buyer_name || null,
        attendee_email: attendee?.email || data.customer?.email || null,
        attendee_phone: attendee?.phone || buyer_phone || null,
      })
    }

    const { data: createdTickets, error: ticketError } = await adminClient
      .from('tickets')
      .insert(tickets)
      .select()

    if (ticketError) {
      console.error('Webhook ticket creation error:', ticketError)
      return NextResponse.json({ error: ticketError.message }, { status: 500 })
    }

    // Increment tickets sold
    await adminClient.rpc('increment_tickets_sold', {
      ticket_type_id,
      amount: quantity,
    })

    // Convert temporary reservation to completed status
    if (metadata.reservation_id && !metadata.reservation_id.startsWith('res-soft-')) {
      await adminClient
        .from('ticket_reservations')
        .update({ status: 'converted' })
        .eq('id', metadata.reservation_id)
    }

    // Auto-add user to event groups if user_id is present
    if (user_id) {
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
            .maybeSingle()
          if (!existing) {
            await adminClient.from('group_members').insert({
              group_id: group.id,
              user_id,
              role: 'member',
            })
          }
        }
      } else {
        const { data: eventData } = await adminClient
          .from('events')
          .select('title')
          .eq('id', event_id)
          .single()

        const { data: newGroup } = await adminClient
          .from('groups')
          .insert({
            event_id,
            name: `${eventData?.title || 'Event'} Group`,
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

      // In-app notification
      await adminClient.from('notifications').insert({
        user_id,
        title: 'Ticket confirmed! 🎉',
        message: 'Your payment was confirmed via Paystack. Your digital ticket is ready in your dashboard.',
        type: 'ticket',
        is_read: false,
      })
    }

    // Send emails
    if (createdTickets && createdTickets.length > 0) {
      const { data: emailEvent } = await adminClient
        .from('events')
        .select('title, event_date, start_time, venue_name')
        .eq('id', event_id)
        .single()

      const { data: emailTicketType } = await adminClient
        .from('ticket_types')
        .select('name')
        .eq('id', ticket_type_id)
        .single()

      const buyerEmail = data.customer?.email
      const eventDateStr = emailEvent?.event_date
        ? new Date(emailEvent.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        : ''
      const eventTimeStr = emailEvent?.start_time ? emailEvent.start_time.slice(0, 5) : ''

      const ticketsByEmail: Record<string, { ticketCode: string; ticketTypeName: string; attendeeName?: string }[]> = {}
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

    return NextResponse.json({ success: true, order_id: order.id }, { status: 200 })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

async function handleGroupPayment(
  adminClient: ReturnType<typeof createAdminClient>,
  data: Record<string, any>,
  metadata: Record<string, any>,
  amountPaid: number,
  reference: string
) {
  const groupId = metadata.group_id
  const spotCount: number = metadata.spots || 1
  const userId = metadata.user_id

  const { data: group } = await adminClient
    .from('groups')
    .select('*, ticket_types(*), events(title, event_date, start_time, venue_name)')
    .eq('id', groupId)
    .single()

  if (!group) return

  const amountPerSpot = amountPaid > 0 ? Math.round(amountPaid / spotCount) : 0
  const attendeeList: AttendeeInput[] = metadata.attendees && metadata.attendees.length === spotCount
    ? metadata.attendees
    : Array.from({ length: spotCount }, () => ({ name: '', email: data.customer?.email || '', phone: '' }))

  // Check if member rows already exist for this reference
  const { data: existingMembers } = await adminClient
    .from('group_members')
    .select('id')
    .eq('payment_reference', reference)

  if (!existingMembers || existingMembers.length === 0) {
    const memberRows = attendeeList.map((a) => ({
      group_id: groupId,
      user_id: userId || null,
      role: group.creator_id === userId ? 'admin' : 'member',
      payment_status: 'paid',
      amount_paid: amountPerSpot,
      payment_reference: reference,
      paid_at: new Date().toISOString(),
      attendee_name: a.name || null,
      attendee_email: a.email || data.customer?.email || null,
      attendee_phone: a.phone || null,
    }))

    await adminClient.from('group_members').insert(memberRows)

    // Record order
    await adminClient.from('orders').insert({
      user_id: userId || null,
      event_id: group.event_id,
      group_id: groupId,
      amount: amountPaid,
      service_fee: 0,
      total_paid: amountPaid,
      payment_method: 'paystack',
      payment_reference: reference,
      payment_status: 'completed',
      buyer_name: attendeeList[0]?.name || null,
      buyer_phone: attendeeList[0]?.phone || null,
    })
  }

  // Check if group is full
  const { count: currentPaid } = await adminClient
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('payment_status', 'paid')

  if ((currentPaid ?? 0) >= group.max_members) {
    const { data: allPaidMembers } = await adminClient
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('payment_status', 'paid')

    const ticketType = Array.isArray(group.ticket_types) ? group.ticket_types[0] : group.ticket_types
    const event = Array.isArray(group.events) ? group.events[0] : group.events

    const ticketsToCreate = (allPaidMembers || [])
      .filter((m) => !m.ticket_id)
      .map((m) => ({
        ticket_type_id: ticketType?.id,
        event_id: group.event_id,
        user_id: m.user_id,
        ticket_code: `PM-GRP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        status: 'active',
        attendee_name: m.attendee_name,
        attendee_phone: m.attendee_phone,
      }))

    if (ticketsToCreate.length > 0) {
      const { data: createdTickets } = await adminClient.from('tickets').insert(ticketsToCreate).select()
      await adminClient.from('groups').update({ status: 'completed' }).eq('id', groupId)

      if (createdTickets) {
        for (let i = 0; i < createdTickets.length; i++) {
          const ticket = createdTickets[i]
          const member = allPaidMembers?.find((m) => m.attendee_name === ticket.attendee_name) || allPaidMembers?.[i]
          if (member) {
            await adminClient.from('group_members').update({ ticket_id: ticket.id }).eq('id', member.id)
            const destEmail = member.attendee_email || data.customer?.email
            if (destEmail) {
              await sendTicketEmail({
                to: destEmail,
                recipientName: member.attendee_name?.split(' ')[0] || 'there',
                eventTitle: event?.title || 'Your event',
                eventDate: event?.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '',
                eventTime: event?.start_time ? event.start_time.slice(0, 5) : '',
                venueName: event?.venue_name || '',
                tickets: [{ ticketCode: ticket.ticket_code, ticketTypeName: ticketType?.name || 'Group Ticket', attendeeName: member.attendee_name || undefined }],
              })
            }
          }
        }
      }
    }
  }
}
