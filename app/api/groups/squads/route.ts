import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export interface SquadSummary {
  id: string
  name: string
  description?: string
  eventId: string
  creatorId: string
  creatorUsername: string
  maxMembers: number
  memberCount: number
  isMember: boolean
  isFull: boolean
  status: string
  createdAt: string
  departureArea?: string
}

/**
 * GET /api/groups/squads?event_id=...
 * Fetch all active squads for a given event with live member counts.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('event_id')

  if (!eventId) {
    return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Fetch squads for this event
  const { data: squads, error: squadsError } = await supabase
    .from('groups')
    .select(`
      id,
      name,
      group_type,
      creator_id,
      max_members,
      is_active,
      is_merged,
      created_at,
      group_members(id, user_id, role, users(username, full_name, tier))
    `)
    .eq('event_id', eventId)
    .eq('group_type', 'squad')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (squadsError) {
    return NextResponse.json({ error: squadsError.message }, { status: 500 })
  }

  const formattedSquads: SquadSummary[] = (squads || []).map((s) => {
    const members = s.group_members || []
    const memberCount = members.length
    const maxMembers = s.max_members || 6
    const isMember = user ? members.some((m: { user_id: string }) => m.user_id === user.id) : false

    return {
      id: s.id,
      name: s.name,
      eventId,
      creatorId: s.creator_id || '',
      creatorUsername: 'Squad Host',
      maxMembers,
      memberCount,
      isMember,
      isFull: memberCount >= maxMembers,
      status: memberCount >= maxMembers ? 'full' : 'open',
      createdAt: s.created_at,
    }
  })

  return NextResponse.json({ squads: formattedSquads })
}

/**
 * POST /api/groups/squads
 * Create a new open squad for an event.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to start a squad' }, { status: 401 })
  }

  const body = await request.json()
  const { event_id, name, max_members, departure_area, description } = body

  if (!event_id || !name?.trim()) {
    return NextResponse.json({ error: 'Event ID and Squad Name are required' }, { status: 400 })
  }

  // Verify user has ticket or access. Array check, not .maybeSingle() —
  // a buyer of quantity > 1 has multiple ticket rows for this event, and
  // .maybeSingle() errors (read as "no ticket") on more than one match.
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id')
    .eq('event_id', event_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
  const ticket = (tickets?.length ?? 0) > 0

  // Create squad group
  const squadName = name.trim()
  const squadMaxMembers = Number(max_members) > 0 ? Number(max_members) : 6
  const { data: newGroup, error: groupError } = await supabase
    .from('groups')
    .insert({
      event_id,
      name: squadName,
      group_type: 'squad',
      creator_id: user.id,
      max_members: squadMaxMembers,
      is_active: true,
      is_merged: false,
    })
    .select()
    .single()

  if (groupError || !newGroup) {
    return NextResponse.json({ error: groupError?.message || 'Failed to create squad' }, { status: 500 })
  }

  // Add creator as squad leader
  await supabase.from('group_members').insert({
    group_id: newGroup.id,
    user_id: user.id,
    role: 'creator',
    payment_status: ticket ? 'paid' : 'pending',
  })

  // Post welcome message
  await supabase.from('group_messages').insert({
    group_id: newGroup.id,
    user_id: user.id,
    message: `🎉 Squad "${squadName}" created! ${description || 'Coordinate meeting times, rides, and plans here.'}`,
  })

  return NextResponse.json({
    success: true,
    squad: {
      id: newGroup.id,
      name: newGroup.name,
      eventId: event_id,
      memberCount: 1,
      maxMembers: squadMaxMembers,
      isMember: true,
    }
  })
}
