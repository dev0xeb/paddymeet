import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ticket_id, reason } = body

    if (!ticket_id || !reason?.trim()) {
      return NextResponse.json({ error: 'Ticket ID and reason for refund are required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 1. Fetch ticket and event schedule
    const { data: ticket, error: ticketError } = await adminClient
      .from('tickets')
      .select('id, user_id, event_id, status, attended, ticket_type_id, events(title, event_date, start_time, organiser_id)')
      .eq('id', ticket_id)
      .maybeSingle()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (ticket.user_id !== user.id) {
      return NextResponse.json({ error: 'You do not own this ticket' }, { status: 403 })
    }

    // 2. Attendance & Usage Validation
    if (ticket.status === 'used' || ticket.attended) {
      return NextResponse.json({
        error: 'Tickets that have already been scanned and checked in cannot be refunded.'
      }, { status: 400 })
    }

    if (ticket.status === 'refunded') {
      return NextResponse.json({ error: 'This ticket has already been refunded.' }, { status: 400 })
    }

    if (ticket.status === 'cancelled') {
      return NextResponse.json({ error: 'This ticket is already cancelled.' }, { status: 400 })
    }

    // 3. Event Schedule Validation
    const event = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events
    if (event?.event_date) {
      const eventStartTime = new Date(`${event.event_date}T${event.start_time || '00:00:00'}`)
      const now = new Date()

      if (now >= eventStartTime) {
        return NextResponse.json({
          error: 'Refunds cannot be requested for events that have already started or passed.'
        }, { status: 400 })
      }
    }

    // 4. Check if an active request already exists
    const { data: existingRequest } = await adminClient
      .from('refund_requests')
      .select('id, status')
      .eq('ticket_id', ticket_id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      return NextResponse.json({ error: 'A refund request is already pending for this ticket.' }, { status: 400 })
    }

    // 5. Create refund request
    const { data: refundReq, error: insertError } = await adminClient
      .from('refund_requests')
      .insert({
        ticket_id,
        user_id: user.id,
        event_id: ticket.event_id,
        reason: reason.trim(),
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Refund request insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Notify organiser
    if (event?.organiser_id) {
      await adminClient.from('notifications').insert({
        user_id: event.organiser_id,
        title: 'New Refund Request',
        message: `A customer requested a refund for "${event.title}". Reason: ${reason.trim()}`,
        type: 'refund',
        is_read: false,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Your refund request has been submitted for review.',
      refund_request_id: refundReq.id,
    })
  } catch (error) {
    console.error('Refund request error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
