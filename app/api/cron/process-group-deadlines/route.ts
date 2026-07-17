import { createAdminClient } from '@/lib/supabase-admin'
import { sendTicketEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  // Find all ticket types whose deadline has passed and haven't been processed yet
  const { data: expiredTicketTypes, error: ttError } = await adminClient
    .from('ticket_types')
    .select('*')
    .eq('is_group_ticket', true)
    .eq('group_deadline_processed', false)
    .lt('group_deadline', now)

  if (ttError) {
    return NextResponse.json({ error: ttError.message }, { status: 400 })
  }

  if (!expiredTicketTypes || expiredTicketTypes.length === 0) {
    return NextResponse.json({ success: true, message: 'No expired group deadlines to process' })
  }

  const results = []

  for (const ticketType of expiredTicketTypes) {
    const result = await processTicketTypeGroups(adminClient, ticketType)
    results.push(result)

    // Mark as processed regardless of outcome so it never runs again
    await adminClient
      .from('ticket_types')
      .update({ group_deadline_processed: true })
      .eq('id', ticketType.id)
  }

  return NextResponse.json({ success: true, results })
}

// Also allow GET for manual trigger from admin dashboard
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ticketTypeId = searchParams.get('ticket_type_id')

  const adminClient = createAdminClient()

  let query = adminClient
    .from('ticket_types')
    .select('*')
    .eq('is_group_ticket', true)
    .eq('group_deadline_processed', false)
    .lt('group_deadline', new Date().toISOString())

  if (ticketTypeId) {
    query = adminClient
      .from('ticket_types')
      .select('*')
      .eq('id', ticketTypeId)
  }

  const { data: ticketTypes } = await query

  if (!ticketTypes || ticketTypes.length === 0) {
    return NextResponse.json({ success: true, message: 'No groups to process' })
  }

  const results = []
  for (const ticketType of ticketTypes) {
    const result = await processTicketTypeGroups(adminClient, ticketType)
    results.push(result)
    await adminClient
      .from('ticket_types')
      .update({ group_deadline_processed: true })
      .eq('id', ticketType.id)
  }

  return NextResponse.json({ success: true, results })
}

async function processTicketTypeGroups(
  adminClient: ReturnType<typeof createAdminClient>,
  ticketType: Record<string, unknown>
) {
  const ticketTypeId = ticketType.id as string
  const groupSize = ticketType.group_size as number
  const ticketPrice = ticketType.price as number
  const eventId = ticketType.event_id as string

  // Get all recruiting groups for this ticket type, with their paid members
  const { data: recruitingGroups } = await adminClient
    .from('groups')
    .select('*, group_members(*)')
    .eq('ticket_type_id', ticketTypeId)
    .eq('status', 'recruiting')
    .order('created_at', { ascending: true })

  if (!recruitingGroups || recruitingGroups.length === 0) {
    return { ticket_type_id: ticketTypeId, message: 'No recruiting groups found' }
  }

  // Build a list of groups with their paid member counts
  const groupsWithCounts = recruitingGroups.map(g => ({
    ...g,
    paidMembers: (g.group_members as Record<string, unknown>[]).filter(
      m => m.payment_status === 'paid'
    ),
  })).filter(g => g.paidMembers.length > 0) // ignore groups with no paid members at all

  if (groupsWithCounts.length === 0) {
    return { ticket_type_id: ticketTypeId, message: 'No groups with paid members' }
  }

  // Sort by paid member count ascending (smallest first — these get merged into others)
  groupsWithCounts.sort((a, b) => a.paidMembers.length - b.paidMembers.length)

  const completedGroups: string[] = []
  const mergedGroups: string[] = []
  const leftoverMembers: Record<string, unknown>[] = []

  // Try to merge smallest groups into others
  // Use a simple greedy approach: take the smallest group, find a group it can merge into
  const processed = new Set<string>()

  // First pass: mark groups that are already full
  for (const group of groupsWithCounts) {
    if (group.paidMembers.length >= groupSize) {
      completedGroups.push(group.id)
      processed.add(group.id)
    }
  }

  // Second pass: merge incomplete groups smallest-first
  const incomplete = groupsWithCounts.filter(g => !processed.has(g.id))

  for (let i = 0; i < incomplete.length; i++) {
    const source = incomplete[i]
    if (processed.has(source.id)) continue

    // Try to find a target group with enough room
    for (let j = i + 1; j < incomplete.length; j++) {
      const target = incomplete[j]
      if (processed.has(target.id)) continue

      const combinedCount = source.paidMembers.length + target.paidMembers.length

      if (combinedCount <= groupSize) {
        // Move source members into target group
        for (const member of source.paidMembers) {
          await adminClient
            .from('group_members')
            .update({ group_id: target.id })
            .eq('id', member.id as string)
        }

        // Mark source group as merged
        await adminClient
          .from('groups')
          .update({ status: 'merged', merged_into_group_id: target.id, is_merged: true })
          .eq('id', source.id)

        mergedGroups.push(source.id)
        processed.add(source.id)

        // Update target's paid member count in memory
        target.paidMembers = [...target.paidMembers, ...source.paidMembers]

        // If target is now full, mark it as completed
        if (target.paidMembers.length >= groupSize) {
          completedGroups.push(target.id)
          processed.add(target.id)
        }

        break
      }
    }

    // If source wasn't merged into anything, its members are leftovers
    if (!processed.has(source.id)) {
      leftoverMembers.push(...source.paidMembers)
      processed.add(source.id)

      // Mark source group as failed
      await adminClient
        .from('groups')
        .update({ status: 'failed' })
        .eq('id', source.id)
    }
  }

  // Fetch event details for emails/notifications
  const { data: event } = await adminClient
    .from('events')
    .select('title, event_date, start_time, venue_name')
    .eq('id', eventId)
    .single()

  // Issue tickets for all completed groups
  for (const groupId of completedGroups) {
    const group = groupsWithCounts.find(g => g.id === groupId)
    if (!group) continue

    // Re-fetch final paid members after merges
    const { data: finalMembers } = await adminClient
      .from('group_members')
      .select('*, users(email, full_name)')
      .eq('group_id', groupId)
      .eq('payment_status', 'paid')

    if (!finalMembers || finalMembers.length === 0) continue

    const ticketsToCreate = finalMembers.map(m => ({
      ticket_type_id: ticketTypeId,
      event_id: eventId,
      user_id: m.user_id,
      ticket_code: `PM-GRP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      status: 'active',
      attendee_name: m.attendee_name || null,
      attendee_phone: m.attendee_phone || null,
    }))

    const { data: createdTickets } = await adminClient
      .from('tickets')
      .insert(ticketsToCreate)
      .select()

    await adminClient
      .from('groups')
      .update({ status: 'completed' })
      .eq('id', groupId)

    // Link tickets to members and notify/email each
    if (createdTickets) {
      for (let i = 0; i < createdTickets.length; i++) {
        const ticket = createdTickets[i]
        const member = finalMembers[i]

        await adminClient
          .from('group_members')
          .update({ ticket_id: ticket.id })
          .eq('id', member.id)

        const memberUser = Array.isArray(member.users) ? member.users[0] : member.users
        const memberEmail = member.attendee_email || memberUser?.email
        const memberName = member.attendee_name || memberUser?.full_name

        await adminClient.from('notifications').insert({
          user_id: member.user_id,
          title: 'Group ticket confirmed! 🎉',
          message: `Your group has been completed and your ticket for ${event?.title} has been issued. Check your email!`,
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
            tickets: [{
              ticketCode: ticket.ticket_code,
              ticketTypeName: ticketType.name as string,
              attendeeName: member.attendee_name || undefined,
            }],
          })
        }
      }
    }
  }

  // Handle leftover members — notify them to switch to a single ticket and release their slot
  for (const member of leftoverMembers) {
    // Release the reserved slot
    await adminClient
      .from('ticket_types')
      .update({ quantity_sold: Math.max(0, (ticketType.quantity_sold as number) - 1) })
      .eq('id', ticketTypeId)

    // Notify the user
    await adminClient.from('notifications').insert({
      user_id: member.user_id,
      title: 'Group ticket update',
      message: `Unfortunately your group for ${event?.title} could not be completed before the deadline. Your payment will be refunded within 3-5 business days. You can still get an individual ticket on the event page.`,
      type: 'ticket',
      is_read: false,
    })

    // Mark their member row as failed
    await adminClient
      .from('group_members')
      .update({ payment_status: 'refund_pending' })
      .eq('id', member.id as string)

    // Notify via email too if we have their email
    const { data: userProfile } = await adminClient
      .from('users')
      .select('email, full_name')
      .eq('id', member.user_id as string)
      .single()

    const destEmail = (member.attendee_email as string) || userProfile?.email
    if (destEmail) {
      await sendTicketEmail({
        to: destEmail,
        recipientName: userProfile?.full_name?.split(' ')[0] || 'there',
        eventTitle: event?.title || 'Your event',
        eventDate: event?.event_date
          ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
          : '',
        eventTime: event?.start_time ? event.start_time.slice(0, 5) : '',
        venueName: event?.venue_name || '',
        tickets: [],
      })
    }
  }

  return {
    ticket_type_id: ticketTypeId,
    groups_completed: completedGroups.length,
    groups_merged: mergedGroups.length,
    leftover_members: leftoverMembers.length,
  }
}