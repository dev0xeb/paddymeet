import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('department')
    .eq('id', user.id)
    .single()

  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    { count: usersCount },
    { count: organisersCount },
    { count: verifiedOrganisersCount },
    { data: recentAnnouncements }
  ] = await Promise.all([
    adminClient.from('users').select('*', { count: 'exact', head: true }).eq('is_suspended', false),
    adminClient.from('organisers').select('*', { count: 'exact', head: true }),
    adminClient.from('organisers').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    adminClient.from('announcements').select('*').order('sent_at', { ascending: false }).limit(5),
  ])

  return NextResponse.json({
    counts: {
      users: usersCount || 0,
      organisers: organisersCount || 0,
      verifiedOrganisers: verifiedOrganisersCount || 0,
    },
    recentAnnouncements: recentAnnouncements || []
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('department')
    .eq('id', user.id)
    .single()

  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only super_admin and marketing can send announcements
  if (!['super_admin', 'marketing', 'operations'].includes(admin.department)) {
    return NextResponse.json({ error: 'Not authorized to send announcements' }, { status: 403 })
  }

  const body = await request.json()
  const { title, message, audience, channel, city, user_email } = body

  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
  }

  // Get target user IDs
  let userIds: string[] = []

  if (audience === 'all') {
    const { data: users } = await adminClient
      .from('users')
      .select('id')
      .eq('is_suspended', false)
    userIds = users?.map(u => u.id) || []
  } else if (audience === 'organisers') {
    const { data: orgs } = await adminClient
      .from('organisers')
      .select('id')
    userIds = orgs?.map(o => o.id) || []
  } else if (audience === 'verified_organisers') {
    const { data: orgs } = await adminClient
      .from('organisers')
      .select('id')
      .eq('is_verified', true)
    userIds = orgs?.map(o => o.id) || []
  } else if (audience === 'city' && city) {
    const { data: users } = await adminClient
      .from('users')
      .select('id')
      .ilike('city', `%${city}%`)
      .eq('is_suspended', false)
    userIds = users?.map(u => u.id) || []
  } else if (audience === 'individual' && user_email) {
    // Check users table first
    const { data: userRecord } = await adminClient
      .from('users')
      .select('id')
      .eq('email', user_email)
      .single()

    if (userRecord) {
      userIds = [userRecord.id]
    } else {
      // Check organisers table
      const { data: orgRecord } = await adminClient
        .from('organisers')
        .select('id')
        .eq('email', user_email)
        .single()

      if (orgRecord) {
        userIds = [orgRecord.id]
      }
    }
  }

  if (userIds.length === 0) {
    return NextResponse.json({ error: 'No recipients found for the selected audience' }, { status: 400 })
  }

  // Create notifications in database
  if (channel === 'push' || channel === 'both') {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type: 'announcement',
      is_read: false,
    }))

    // Insert in batches of 100
    for (let i = 0; i < notifications.length; i += 100) {
      await adminClient
        .from('notifications')
        .insert(notifications.slice(i, i + 100))
    }
  }

  // Save announcement record
  await adminClient
    .from('announcements')
    .insert({
      title,
      message,
      audience,
      channel,
      city: city || null,
      sent_by: user.id,
      sent_to_count: userIds.length,
    })

  return NextResponse.json({
    success: true,
    sent_to: userIds.length,
  })
}