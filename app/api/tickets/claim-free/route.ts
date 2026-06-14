import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const { event_id, ticket_type_id, quantity, user_id } = body

  // Create free tickets
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

  // Auto-add user to event groups
  const { data: eventGroups } = await supabase
    .from('groups')
    .select('id, group_type')
    .eq('event_id', event_id)
    .eq('is_active', true)

  if (eventGroups && eventGroups.length > 0) {
    for (const group of eventGroups) {
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user_id)
        .single()

      if (!existing) {
        await supabase.from('group_members').insert({
          group_id: group.id,
          user_id,
          role: 'member',
        })
      }
    }
  } else {
    // No groups yet — create main event group automatically
    const { data: event } = await supabase
      .from('events')
      .select('title')
      .eq('id', event_id)
      .single()

    const { data: newGroup } = await supabase
      .from('groups')
      .insert({
        event_id,
        name: `${event?.title || 'Event'} Group`,
        group_type: 'main',
        creator_id: user_id,
        is_active: true,
        is_merged: false,
      })
      .select()
      .single()

    if (newGroup) {
      await supabase.from('group_members').insert({
        group_id: newGroup.id,
        user_id,
        role: 'member',
      })
    }
  }

// Send confirmation notification
  await supabase
    .from('notifications')
    .insert({
      user_id,
      title: 'Free ticket confirmed! 🎉',
      message: 'Your free ticket has been confirmed. You have also been added to the event group. See you there!',
      type: 'ticket',
      is_read: false,
    })

  // Referral discount trigger — check if this is the user's first ticket
  await awardReferralDiscount(supabase, user_id)

  return NextResponse.json({ success: true, tickets: createdTickets })
}

async function awardReferralDiscount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user_id: string
) {
  const { data: profile } = await supabase
    .from('users')
    .select('referred_by, referral_converted')
    .eq('id', user_id)
    .single()

  if (!profile?.referred_by || profile.referral_converted) return

  // Check if this is the user's first ticket
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user_id)

  if ((count ?? 0) > 1) return // already had a ticket before this one

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('referral_discount_percent')
    .eq('id', 1)
    .single()

  const discount = settings?.referral_discount_percent ?? 10

  await supabase
    .from('users')
    .update({ referral_discount_percent: discount, referral_converted: true })
    .eq('id', profile.referred_by)

  await supabase
    .from('users')
    .update({ referral_converted: true })
    .eq('id', user_id)

  await supabase.from('notifications').insert({
    user_id: profile.referred_by,
    title: 'Referral reward unlocked! 🎁',
    message: `A friend you referred just got their first ticket. You have earned a ${discount}% discount on your next ticket purchase.`,
    type: 'referral',
    is_read: false,
  })
}