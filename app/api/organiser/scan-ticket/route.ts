import { createClient } from '@/lib/supabase-server'
import { validateAndCheckInTicket } from '@/lib/ticketScan'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: organiser } = await supabase
    .from('organisers')
    .select('id')
    .eq('id', user.id)
    .single()
  if (!organiser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { ticket_code, event_id } = body

  if (!ticket_code) return NextResponse.json({ error: 'No ticket code provided' }, { status: 400 })

  const result = await validateAndCheckInTicket({
    supabase,
    ticketCode: ticket_code,
    eventId: event_id || undefined,
    organiserId: user.id,
  })

  return NextResponse.json(result)
}
