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
    const { data: messages, error } = await adminClient
      .from('support_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mark user messages as read
    await adminClient
      .from('support_messages')
      .update({ is_read: true })
      .eq('ticket_id', id)
      .neq('sender_id', user.id)

    return NextResponse.json({ messages: messages || [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: admin } = await adminClient
      .from('admin_team')
      .select('department')
      .eq('id', user.id)
      .single()

    if (!admin || !['super_admin', 'support', 'operations'].includes(admin.department)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
    }

    // Get ticket to find the recipient user
    const { data: ticket } = await adminClient
      .from('support_tickets')
      .select('user_id, status, subject')
      .eq('id', id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Insert admin response message
    const { data: newMessage, error: msgErr } = await adminClient
      .from('support_messages')
      .insert({
        ticket_id: id,
        sender_id: user.id,
        sender_type: 'admin',
        message: message.trim(),
        is_read: false,
      })
      .select()
      .single()

    if (msgErr) {
      return NextResponse.json({ error: msgErr.message }, { status: 500 })
    }

    // Update ticket status to in_progress if it was open
    if (ticket.status === 'open') {
      await adminClient
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', id)
    }

    // Create a notification for the user
    if (ticket.user_id) {
      await adminClient.from('notifications').insert({
        user_id: ticket.user_id,
        title: 'Support Response: ' + ticket.subject,
        message: message.trim().slice(0, 120),
        type: 'support',
        is_read: false,
      })
    }

    return NextResponse.json({ success: true, message: newMessage })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
