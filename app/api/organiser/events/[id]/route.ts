import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('organiser_id', user.id)
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  return NextResponse.json({ event })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: existing } = await supabase
    .from('events')
    .select('id, organiser_id')
    .eq('id', id)
    .eq('organiser_id', user.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const body = await request.json()

  const allowedFields = [
    'title', 'event_type', 'vibe', 'description', 'age_restriction',
    'dress_code', 'capacity', 'event_date', 'start_time', 'end_time',
    'venue_name', 'venue_address', 'city', 'state',
    'cancellation_policy', 'house_rules', 'website', 'social_link',
  ]

  const updates: Record<string, string | number | boolean | null> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  // Reset to pending review
  updates.is_approved = false
  updates.is_live = false

  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .eq('organiser_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}