import { createClient } from '@/lib/supabase-server'
import { sendTicketEmail } from '@/lib/email'
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

  // Verify payment with Paystack (skip for free group tickets where reference === 'FREE')
  let amountPaid = 0
  if (reference !== 'FREE') {
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    )
    const verifyData = await verifyResponse.json()

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }
    amountPaid = verifyData.data.amount / 100
  }

  const { data: group } = await supabase
    .from('groups')
    .select('*, ticket_types(*), events(title, event_date, start_time, venue_name)')
    .eq('id', groupId)
    .single()

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

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

  // Insert one paid group_members row per spot
  const memberRows = attendeeList.map((a) => ({
    group_id: groupId,
    user_id: user.id,
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
      ticket_code: `PM-GRP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      status: 'active',
      attendee_name: m.attendee_name,
      attendee_phone: m.attendee_phone,
    }))

    const { data: createdTickets } = await supabase
      .from('tickets')
      .insert(ticketsToCreate)
      .select()

    await supabase.from('groups').update({ status: 'completed' }).eq('id', groupId)

    // Link tickets back to their member rows and send emails
    if (createdTickets && allPaidMembers) {
      for (let i = 0; i < createdTickets.length; i++) {
        const ticket = createdTickets[i]
        const member = allPaidMembers[i]

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
      tickets: insertedMembers.map((m, i) => ({
        ticket_code: createdTickets?.find(t => t.user_id === m.user_id)?.ticket_code,
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