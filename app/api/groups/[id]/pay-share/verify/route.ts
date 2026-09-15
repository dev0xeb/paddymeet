import { createClient } from '@/lib/supabase-server'
import { sendTicketEmail } from '@/lib/email'
import { generateTicketCode } from '@/lib/ticketCode'
import { NextRequest, NextResponse } from 'next/server'

interface AttendeeInput {
  name: string
  email: string
  phone: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { reference, spots, attendees } = body
  const spotCount: number = spots || 1

  const { data: group } = await supabase
    .from('groups')
    .select('*, ticket_types(*), events(title, event_date, start_time, venue_name)')
    .eq('id', groupId)
    .single()

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  const expectedAmount = (group.amount_per_member || 0) * spotCount

  // Verify payment with Paystack (skip for free group tickets where reference === 'FREE')
  let amountPaid = 0
  if (reference === 'FREE') {
    // A "FREE" reference is only legitimate if this group is actually free —
    // otherwise it's an unauthenticated way to skip payment on a paid group.
    if (expectedAmount > 0) {
      return NextResponse.json({ error: 'This group requires payment.' }, { status: 400 })
    }
  } else {
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    )
    const verifyData = await verifyResponse.json()

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }
    amountPaid = verifyData.data.amount / 100

    // Never trust the client for the amount — recompute what this many
    // spots should actually cost from the group's own stored per-member price.
    if (Math.abs(amountPaid - expectedAmount) > 1) {
      return NextResponse.json({
        error: `Payment amount does not match the group's price. If you were charged, contact support with reference ${reference}.`,
      }, { status: 400 })
    }
  }

  // Idempotency check: if webhook already fulfilled this group share payment
  if (reference !== 'FREE') {
    const { data: existingMembers } = await supabase
      .from('group_members')
      .select('id, attendee_name, ticket_id')
      .eq('payment_reference', reference)

    if (existingMembers && existingMembers.length > 0) {
      return NextResponse.json({
        success: true,
        group_completed: group.status === 'completed',
        members_paid: existingMembers.length,
      })
    }
  }

  // Re-check capacity right before committing
  const { count: currentPaid } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId)
    .eq('payment_status', 'paid')

  if ((currentPaid ?? 0) + spotCount > group.max_members) {
    return NextResponse.json({ error: 'Not enough spots remaining in this group' }, { status: 400 })
  }

  const amountPerSpot = amountPaid > 0 ? Math.round(amountPaid / spotCount) : 0
  const attendeeList: AttendeeInput[] = attendees && attendees.length === spotCount
    ? attendees
    : Array.from({ length: spotCount }, () => ({ name: '', email: '', phone: '' }))

  // group_members is unique on (group_id, user_id, seat_number), not just
  // (group_id, user_id) — a single payer can hold several spots, so each
  // row for this purchase needs its own seat number, continuing on from
  // any seats this user already holds in the group.
  const { data: existingSeats } = await supabase
    .from('group_members')
    .select('seat_number')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
  const nextSeat = (existingSeats || []).reduce((max, s) => Math.max(max, s.seat_number || 1), 0) + 1

  // Insert one paid group_members row per spot
  const memberRows = attendeeList.map((a, i) => ({
    group_id: groupId,
    user_id: user.id,
    seat_number: nextSeat + i,
    role: group.creator_id === user.id ? 'admin' : 'member',
    payment_status: 'paid',
    amount_paid: amountPerSpot,
    payment_reference: reference,
    paid_at: new Date().toISOString(),
    attendee_name: a.name || null,
    attendee_email: a.email || null,
    attendee_phone: a.phone || null,
  }))

  const { data: insertedMembers, error: insertError } = await supabase
    .from('group_members')
    .insert(memberRows)
    .select()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  // Record the order for revenue tracking
  if (amountPaid > 0) {
    await supabase.from('orders').insert({
      user_id: user.id,
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

  const ticketType = Array.isArray(group.ticket_types) ? group.ticket_types[0] : group.ticket_types
  const event = Array.isArray(group.events) ? group.events[0] : group.events

  const { data: buyerProfile } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', user.id)
    .single()

  const totalPaidNow = (currentPaid ?? 0) + spotCount
  const groupCompleted = totalPaidNow >= group.max_members

  if (groupCompleted) {
    // Guard against two near-simultaneous last payments both entering this
    // branch: only the request that actually flips the group from
    // 'recruiting' to 'completed' issues tickets. Without this, both
    // requests would independently fetch every paid member and insert a
    // full duplicate set of tickets (and duplicate confirmation emails)
    // for the whole group.
    const { data: completionRows } = await supabase
      .from('groups')
      .update({ status: 'completed' })
      .eq('id', groupId)
      .eq('status', 'recruiting')
      .select('id')

    if (!completionRows || completionRows.length === 0) {
      // Another concurrent request already completed this group and is
      // issuing tickets to every paid member, this one included.
      return NextResponse.json({
        success: true,
        group_completed: true,
        members_paid: totalPaidNow,
      })
    }

    // Group is full — issue tickets to every paid member
    const { data: allPaidMembers } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('payment_status', 'paid')

    const ticketsToCreate = (allPaidMembers || []).map((m) => ({
      ticket_type_id: ticketType?.id,
      event_id: group.event_id,
      user_id: m.user_id,
      ticket_code: generateTicketCode('PM-GRP'),
      status: 'active',
      attendee_name: m.attendee_name,
      attendee_phone: m.attendee_phone,
    }))

    const { data: createdTickets } = await supabase
      .from('tickets')
      .insert(ticketsToCreate)
      .select()

    if (ticketType?.id) {
      await supabase.rpc('increment_tickets_sold', {
        ticket_type_id: ticketType.id,
        amount: ticketsToCreate.length,
      })
    }

    // Link tickets back to their member rows and send emails. Paired by
    // array index (ticketsToCreate was built by mapping allPaidMembers 1:1
    // in the same order), not by user_id — a single payer can hold several
    // seats now, so user_id alone can't identify which ticket is whose.
    const ticketCodeByMemberId: Record<string, string> = {}
    if (createdTickets && allPaidMembers) {
      for (let i = 0; i < createdTickets.length; i++) {
        const ticket = createdTickets[i]
        const member = allPaidMembers[i]
        ticketCodeByMemberId[member.id] = ticket.ticket_code

        await supabase.from('group_members').update({ ticket_id: ticket.id }).eq('id', member.id)

        const destEmail = member.attendee_email || (member.user_id === user.id ? buyerProfile?.email : null)
        if (destEmail) {
          await sendTicketEmail({
            to: destEmail,
            recipientName: member.attendee_name?.split(' ')[0] || 'there',
            eventTitle: event?.title || 'Your event',
            eventDate: event?.event_date
              ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
              : '',
            eventTime: event?.start_time ? event.start_time.slice(0, 5) : '',
            venueName: event?.venue_name || '',
            tickets: [{ ticketCode: ticket.ticket_code, ticketTypeName: ticketType?.name || 'Group Ticket', attendeeName: member.attendee_name || undefined }],
          })
        }

        await supabase.from('notifications').insert({
          user_id: member.user_id,
          title: 'Group ticket confirmed! 🎉',
          message: `Your group "${group.name}" is complete. Your ticket for ${event?.title} has been issued.`,
          type: 'ticket',
          is_read: false,
        })
      }
    }

    return NextResponse.json({
      success: true,
      group_completed: true,
      tickets: insertedMembers.map((m) => ({
        ticket_code: ticketCodeByMemberId[m.id],
        attendee_name: m.attendee_name,
      })),
    })
  }

  // Not full yet — notify other paid members of progress
  const remaining = group.max_members - totalPaidNow
  const { data: otherPaidMembers } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('payment_status', 'paid')
    .neq('user_id', user.id)

  if (otherPaidMembers && otherPaidMembers.length > 0) {
    const uniqueUserIds = [...new Set(otherPaidMembers.map(m => m.user_id))]
    await supabase.from('notifications').insert(
      uniqueUserIds.map(uid => ({
        user_id: uid,
        title: 'Group update',
        message: `Your group "${group.name}" now has ${totalPaidNow}/${group.max_members} spots filled. ${remaining} spot${remaining === 1 ? '' : 's'} left.`,
        type: 'group',
        is_read: false,
      }))
    )
  }

  return NextResponse.json({
    success: true,
    group_completed: false,
    members_paid: totalPaidNow,
    max_members: group.max_members,
  })
}