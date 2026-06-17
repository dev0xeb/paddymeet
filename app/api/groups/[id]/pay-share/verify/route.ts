import { createClient } from '@/lib/supabase-server'
import { sendTicketEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { reference, attendee_name, attendee_phone } = body

  // Verify payment with Paystack
  const verifyResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  )
  const verifyData = await verifyResponse.json()

  if (!verifyData.status || verifyData.data.status !== 'success') {
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
  }

  const amountPaid = verifyData.data.amount / 100

  // Mark this member as paid
  const { error: updateError } = await supabase
    .from('group_members')
    .update({
      payment_status: 'paid',
      amount_paid: amountPaid,
      payment_reference: reference,
      paid_at: new Date().toISOString(),
    })
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  // Store attendee info on the member row by reusing tickets table later; for now stash on member via metadata not in schema —
  // we will pass attendee details into ticket creation when group completes, keyed by user via a temp table-free approach:
  // simplest: create an order row capturing buyer_name/phone for this member's share, linked to group
  const { data: group } = await supabase
    .from('groups')
    .select('*, ticket_types(*), events(title, event_date, start_time, venue_name)')
    .eq('id', groupId)
    .single()

  const ticketType = Array.isArray(group?.ticket_types) ? group.ticket_types[0] : group?.ticket_types
  const event = Array.isArray(group?.events) ? group.events[0] : group?.events

  await supabase.from('orders').insert({
    user_id: user.id,
    event_id: group?.event_id,
    group_id: groupId,
    amount: amountPaid,
    service_fee: 0,
    total_paid: amountPaid,
    payment_method: 'paystack',
    payment_reference: reference,
    payment_status: 'completed',
    buyer_name: attendee_name || null,
    buyer_phone: attendee_phone || null,
  })

  // Check if group is now full (all members paid)
  const { data: members } = await supabase
    .from('group_members')
    .select('*, users(email, full_name)')
    .eq('group_id', groupId)

  const paidMembers = members?.filter(m => m.payment_status === 'paid') || []

  if (paidMembers.length >= (group?.max_members || 999)) {
    // Group is complete — issue tickets to everyone
    const ticketsToCreate = paidMembers.map((m) => ({
      ticket_type_id: ticketType?.id,
      event_id: group?.event_id,
      user_id: m.user_id,
      ticket_code: `PM-GRP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      status: 'active',
      attendee_name: m.user_id === user.id ? (attendee_name || null) : null,
      attendee_phone: m.user_id === user.id ? (attendee_phone || null) : null,
    }))

    const { data: createdTickets } = await supabase
      .from('tickets')
      .insert(ticketsToCreate)
      .select()

    // Mark group completed
    await supabase
      .from('groups')
      .update({ status: 'completed' })
      .eq('id', groupId)

    // Link ticket ids back to members and notify/email each
    if (createdTickets) {
      for (const ticket of createdTickets) {
        await supabase
          .from('group_members')
          .update({ ticket_id: ticket.id })
          .eq('group_id', groupId)
          .eq('user_id', ticket.user_id)

        const memberUser = members?.find(m => m.user_id === ticket.user_id)?.users
        const memberEmail = Array.isArray(memberUser) ? memberUser[0]?.email : memberUser?.email
        const memberName = Array.isArray(memberUser) ? memberUser[0]?.full_name : memberUser?.full_name

        await supabase.from('notifications').insert({
          user_id: ticket.user_id,
          title: 'Group ticket confirmed! 🎉',
          message: `Your group "${group?.name}" is complete. Your ticket for ${event?.title} has been issued.`,
          type: 'ticket',
          is_read: false,
        })

        if (memberEmail) {
          await sendTicketEmail({
            to: memberEmail,
            recipientName: memberName?.split(' ')[0] || 'there',
            eventTitle: event?.title || 'Your event',
            eventDate: event?.event_date
              ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
              : '',
            eventTime: event?.start_time ? event.start_time.slice(0, 5) : '',
            venueName: event?.venue_name || '',
            tickets: [{ ticketCode: ticket.ticket_code, ticketTypeName: ticketType?.name || 'Group Ticket' }],
          })
        }
      }
    }

    return NextResponse.json({ success: true, group_completed: true, ticket: ticketsToCreate.find(t => t.user_id === user.id) })
  }

  // Group not full yet — notify other members of progress
  const remaining = (group?.max_members || 0) - paidMembers.length
  await supabase.from('notifications').insert(
    (members || [])
      .filter(m => m.user_id !== user.id && m.payment_status === 'paid')
      .map(m => ({
        user_id: m.user_id,
        title: 'Group update',
        message: `Your group "${group?.name}" now has ${paidMembers.length}/${group?.max_members} members paid. ${remaining} spot${remaining === 1 ? '' : 's'} left.`,
        type: 'group',
        is_read: false,
      }))
  )

  return NextResponse.json({ success: true, group_completed: false, members_paid: paidMembers.length, max_members: group?.max_members })
}