import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { email, phone, ticket_type_id } = body

    const targetEmail = email?.trim() || user?.email
    if (!targetEmail) {
      return NextResponse.json({ error: 'Email address is required to join the waitlist.' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 1. Verify event exists
    const { data: event, error: eventError } = await adminClient
      .from('events')
      .select('id, title, event_date')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // 2. Check if already on active waitlist
    const { data: existing } = await adminClient
      .from('event_waitlist')
      .select('id, status, created_at')
      .eq('event_id', eventId)
      .eq('email', targetEmail.toLowerCase())
      .in('status', ['waiting', 'notified'])
      .maybeSingle()

    if (existing) {
      // Calculate queue position
      const { count: aheadCount } = await adminClient
        .from('event_waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'waiting')
        .lte('created_at', existing.created_at)

      return NextResponse.json({
        success: true,
        already_joined: true,
        position: aheadCount || 1,
        message: `You are already on the waitlist for "${event.title}" (Queue Position #${aheadCount || 1}).`,
      })
    }

    // 3. Add to waitlist queue
    const { data: waitlistEntry, error: insertError } = await adminClient
      .from('event_waitlist')
      .insert({
        event_id: eventId,
        ticket_type_id: ticket_type_id || null,
        user_id: user?.id || null,
        email: targetEmail.toLowerCase(),
        phone: phone || null,
        status: 'waiting',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Waitlist insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 4. Calculate total in queue
    const { count: totalQueue } = await adminClient
      .from('event_waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'waiting')

    return NextResponse.json({
      success: true,
      position: totalQueue || 1,
      message: `You have joined the waitlist for "${event.title}"! We'll notify you the instant a ticket opens up.`,
    })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
