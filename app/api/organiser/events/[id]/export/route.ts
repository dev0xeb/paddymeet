import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()

    // 1. Verify access (must be the event organiser or an admin)
    const { data: event, error: eventError } = await adminClient
      .from('events')
      .select('id, title, event_date, start_time, organiser_id')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organiser_id !== user.id) {
      const { data: admin } = await adminClient
        .from('admin_team')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // 2. Fetch all tickets for this event
    const { data: tickets, error: ticketError } = await adminClient
      .from('tickets')
      .select('id, ticket_code, attendee_name, attendee_email, attendee_phone, status, attended, attendance_marked_at, created_at, ticket_types(name, price), users(full_name, email, phone)')
      .eq('event_id', id)
      .order('created_at', { ascending: false })

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 500 })
    }

    // 3. Build CSV string
    const headers = [
      'Ticket Code',
      'Attendee Name',
      'Email',
      'Phone',
      'Ticket Tier',
      'Price (NGN)',
      'Status',
      'Checked In',
      'Check-in Timestamp',
      'Purchased At',
    ]

    const rows = (tickets || []).map(t => {
      const tt = Array.isArray(t.ticket_types) ? t.ticket_types[0] : t.ticket_types
      const u = Array.isArray(t.users) ? t.users[0] : t.users

      const name = t.attendee_name || u?.full_name || 'Guest'
      const email = t.attendee_email || u?.email || ''
      const phone = t.attendee_phone || u?.phone || ''
      const tier = tt?.name || 'General'
      const price = tt?.price || 0
      const status = t.status || 'active'
      const checkedIn = t.attended ? 'YES' : 'NO'
      const checkinTime = t.attendance_marked_at ? new Date(t.attendance_marked_at).toLocaleString() : '—'
      const purchaseTime = t.created_at ? new Date(t.created_at).toLocaleString() : '—'

      // Escape quotes and commas
      const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`

      return [
        escape(t.ticket_code),
        escape(name),
        escape(email),
        escape(phone),
        escape(tier),
        price,
        escape(status),
        escape(checkedIn),
        escape(checkinTime),
        escape(purchaseTime),
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\r\n')
    const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, '_')
    const filename = `manifest_${safeTitle}_${event.event_date || 'event'}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export attendees error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
