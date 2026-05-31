import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { event_id, ticket_type_id, quantity, user_id } = body

  const tickets = []
  for (let i = 0; i < quantity; i++) {
    tickets.push({
      ticket_type_id,
      event_id,
      user_id,
      ticket_code: `PM-FREE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      status: 'active',
    })
  }

  const { data: createdTickets, error } = await supabase
    .from('tickets')
    .insert(tickets)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await supabase
    .from('notifications')
    .insert({
      user_id,
      title: 'Free ticket confirmed!',
      message: `Your free ticket has been confirmed. See you there!`,
      type: 'ticket',
      is_read: false,
    })

  return NextResponse.json({ success: true, tickets: createdTickets })
}
