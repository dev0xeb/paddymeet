import { createClient } from '@/lib/supabase-server'
import { parseChatMessage, encodeChatMessage } from '@/lib/chatMedia'
import { NextRequest, NextResponse } from 'next/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

/**
 * A user may read/write a group's messages if they:
 * - are the event's organiser, or
 * - hold an active ticket for the event (main/ticket/social rooms), or
 * - are a member of the group (required for squad sub-rooms).
 */
async function canAccessGroup(
  supabase: SupabaseServerClient,
  userId: string,
  groupId: string
): Promise<boolean> {
  const { data: group } = await supabase
    .from('groups')
    .select('event_id, group_type')
    .eq('id', groupId)
    .maybeSingle()

  if (!group) return false

  const { data: event } = await supabase
    .from('events')
    .select('organiser_id')
    .eq('id', group.event_id)
    .maybeSingle()

  if (event?.organiser_id === userId) return true

  if (group.group_type === 'squad' || group.group_type === 'ticket') {
    // Array select, not .maybeSingle() — that errors (and reads as "no
    // access") if a group somehow ends up with more than one membership
    // row for the same user, which has happened in practice.
    //
    // 'ticket' groups (a shared table/group ticket) specifically must be
    // checked this way rather than falling through to the ticket-ownership
    // check below: a member of the group doesn't get an actual ticket
    // issued until the whole table fills up, so checking for an active
    // ticket here locked every member — including whoever started the
    // table — out of their own group's chat the entire time they're still
    // waiting on it to complete. This matches group_chat_access() in
    // 004_group_messages_rls.sql, which already grants access to any
    // group_members row here — this app-layer check had drifted from that
    // RLS policy's own documented intent.
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .limit(1)
    return (membership?.length ?? 0) > 0
  }

  // Array select, not .maybeSingle() — a buyer of quantity > 1 has multiple
  // active ticket rows for the same event, and .maybeSingle() errors (read
  // as "no access") on more than one match. Same fix as the membership
  // check above.
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id')
    .eq('event_id', group.event_id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)

  return (ticket?.length ?? 0) > 0
}

/**
 * GET /api/groups/messages?group_id=...
 * Fetch messages for a specific group/squad with sender details and media attachments.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('group_id')

  if (!groupId) {
    return NextResponse.json({ error: 'group_id is required' }, { status: 400 })
  }

  if (!(await canAccessGroup(supabase, user.id, groupId))) {
    return NextResponse.json({ error: 'You do not have access to this chat room' }, { status: 403 })
  }

  const { data: messages, error } = await supabase
    .from('group_messages')
    .select(`
      id,
      group_id,
      user_id,
      message,
      created_at
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch senders' profile info
  const userIds = [...new Set(messages.map((m) => m.user_id))]
  const { data: users } = await supabase
    .from('users')
    .select('id, username, full_name, tier, avatar_url')
    .in('id', userIds)

  const userMap = new Map((users || []).map((u) => [u.id, u]))

  const formattedMessages = messages.map((m) => {
    const sender = userMap.get(m.user_id)
    const { text: textContent, mediaUrl, mediaType } = parseChatMessage(m.message)

    return {
      id: m.id,
      groupId: m.group_id,
      userId: m.user_id,
      text: textContent,
      mediaUrl,
      mediaType,
      createdAt: m.created_at,
      sender: {
        username: sender?.username || 'Explorer',
        fullName: sender?.full_name || 'Explorer',
        tier: sender?.tier || 'Explorer',
        avatarUrl: sender?.avatar_url,
      },
    }
  })

  return NextResponse.json({ messages: formattedMessages })
}

/**
 * POST /api/groups/messages
 * Send a message or media attachment to a group.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { group_id, message, media_url, media_type } = body

  if (!group_id) {
    return NextResponse.json({ error: 'group_id is required' }, { status: 400 })
  }

  if (!message?.trim() && !media_url) {
    return NextResponse.json({ error: 'Message or media is required' }, { status: 400 })
  }

  if (!(await canAccessGroup(supabase, user.id, group_id))) {
    return NextResponse.json({ error: 'You do not have access to this chat room' }, { status: 403 })
  }

  // Format message payload with media tag
  const finalMessageContent = encodeChatMessage(message?.trim() || '', media_url, media_type)

  const { data: newMessage, error } = await supabase
    .from('group_messages')
    .insert({
      group_id,
      user_id: user.id,
      message: finalMessageContent,
    })
    .select()
    .single()

  if (error || !newMessage) {
    return NextResponse.json({ error: error?.message || 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: {
      id: newMessage.id,
      groupId: newMessage.group_id,
      userId: newMessage.user_id,
      text: message?.trim() || '',
      mediaUrl: media_url,
      mediaType: media_type,
      createdAt: newMessage.created_at,
    }
  })
}
