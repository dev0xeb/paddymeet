import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const searchParams = request.nextUrl.searchParams
  const autoVerifyHost = searchParams.get('autoVerifyHost') === 'true'

  // Fetch event and organiser
  const { data: event } = await adminClient
    .from('events')
    .select('id, title, city, state, event_date, event_type, vibe, organiser_id, organisers(id, org_name, is_verified)')
    .eq('id', id)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const organiser = event.organisers as unknown as { id: string, org_name: string, is_verified: boolean } | null

  // Enforce Host KYC Rule
  if (!organiser?.is_verified) {
    if (autoVerifyHost && organiser?.id) {
      // Auto-verify host as requested by admin
      await adminClient
        .from('organisers')
        .update({ is_verified: true, is_active: true })
        .eq('id', organiser.id)
    } else {
      return NextResponse.json({
        error: 'Host Unverified',
        message: `Cannot approve event: "${organiser?.org_name || 'The host'}" is not yet verified. Please verify the host first.`,
        requires_kyc: true,
        host_id: organiser?.id,
        host_name: organiser?.org_name,
      }, { status: 400 })
    }
  }

  // Approve the event
  const { error } = await adminClient
    .from('events')
    .update({ is_approved: true, is_live: true, is_rejected: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Auto-create the main event group if it doesn't already exist
  const { data: existingMainGroup } = await adminClient
    .from('groups')
    .select('id')
    .eq('event_id', id)
    .eq('group_type', 'main')
    .single()

  if (!existingMainGroup && event) {
    await adminClient.from('groups').insert({
      event_id: id,
      name: `${event.title} — Everyone`,
      group_type: 'main',
      creator_id: event.organiser_id,
      is_active: true,
      is_merged: false,
    })
  }

  if (event) {
    // Find users in the same city
    const { data: cityUsers } = await adminClient
      .from('users')
      .select('id')
      .ilike('city', `%${event.city}%`)
      .eq('is_suspended', false)

    if (cityUsers && cityUsers.length > 0) {
      const eventDate = event.event_date
        ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
        : 'Coming soon'

      const notifications = cityUsers.map(u => ({
        user_id: u.id,
        title: `New event near you 🎉`,
        message: `${event.title} — ${event.event_type} in ${event.city} on ${eventDate}. Tap to see details and get your tickets.`,
        type: 'new_event',
        is_read: false,
        event_id: id,
      }))

      // Insert in batches of 100
      for (let i = 0; i < notifications.length; i += 100) {
        await adminClient
          .from('notifications')
          .insert(notifications.slice(i, i + 100))
      }
    }

    // Also notify users whose interests match the event vibe or type
    if (event.event_type) {
      const { data: interestedUsers } = await adminClient
        .from('user_interests')
        .select('user_id')
        .ilike('interest', `%${event.event_type}%`)

      if (interestedUsers && interestedUsers.length > 0) {
        // Filter out users already notified (same city)
        const cityUserIds = new Set(cityUsers?.map(u => u.id) || [])
        const newUsers = interestedUsers.filter(u => !cityUserIds.has(u.user_id))

        if (newUsers.length > 0) {
          const interestNotifications = newUsers.map(u => ({
            user_id: u.user_id,
            title: `${event.event_type} event you might like 🎶`,
            message: `${event.title} is happening in ${event.city}. Based on your interests, you might love this one.`,
            type: 'new_event',
            is_read: false,
            event_id: id,
          }))

          for (let i = 0; i < interestNotifications.length; i += 100) {
            await adminClient
              .from('notifications')
              .insert(interestNotifications.slice(i, i + 100))
          }
        }
      }
    }
  }

  const isJson = request.headers.get('accept')?.includes('application/json') || request.nextUrl.searchParams.has('autoVerifyHost')
  if (isJson) {
    return NextResponse.json({ success: true, message: 'Event approved and published live' })
  }

  return NextResponse.redirect(new URL('/admin/dashboard/events', request.url))
}