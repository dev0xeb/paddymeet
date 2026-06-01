import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

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
  if (!['super_admin', 'marketing'].includes(admin.department)) {
    return NextResponse.json({ error: 'Not authorized to send announcements' }, { status: 403 })
  }

  const body = await request.json()
  const { title, message, audience, channel, city, user_email } = body

  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
  }

  // Get target users
  let userIds: string[] = []

  if (audience === 'all') {
    const { data: users } = await adminClient
      .from('users')
      .select('id')
      .eq('is_suspended', false)
    userIds = users?.map(u => u.id) || []
  } else if (audience === 'city' && city) {
    const { data: users } = await adminClient
      .from('users')
      .select('id')
      .ilike('city', `%${city}%`)
      .eq('is_suspended', false)
    userIds = users?.map(u => u.id) || []
  } else if (audience === 'individual' && user_email) {
    const { data: users } = await adminClient
      .from('users')
      .select('id')
      .eq('email', user_email)
    userIds = users?.map(u => u.id) || []
  }

  if (userIds.length === 0) {
    return NextResponse.json({ error: 'No users found for the selected audience' }, { status: 400 })
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