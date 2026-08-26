import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = adminClient
      .from('support_tickets')
      .select('id, user_id, subject, message, status, priority, assigned_to, created_at, users(id, username, email, phone, avatar_url, trust_score)')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,message.ilike.%${search}%`)
    }

    const { data: tickets, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tickets: tickets || [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const body = await request.json()
    const { subject, message, priority = 'medium', user_id } = body

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    const targetUserId = user_id || user.id

    const { data: ticket, error: ticketErr } = await adminClient
      .from('support_tickets')
      .insert({
        user_id: targetUserId,
        subject,
        message,
        priority,
        status: 'open',
      })
      .select('*, users(id, username, email, phone, avatar_url)')
      .single()

    if (ticketErr) {
      return NextResponse.json({ error: ticketErr.message }, { status: 500 })
    }

    // Insert initial message into support_messages
    await adminClient.from('support_messages').insert({
      ticket_id: ticket.id,
      sender_id: targetUserId,
      sender_type: 'user',
      message,
    })

    return NextResponse.json({ success: true, ticket })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}