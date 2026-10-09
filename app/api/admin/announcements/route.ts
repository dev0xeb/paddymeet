import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendAnnouncementEmails } from '@/lib/email'
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

  // Get target recipients (id + email/name, so the same lookup can drive
  // both the in-app notification and the email).
  let recipients: { id: string, email: string | null, name: string | null }[] = []

  if (audience === 'all') {
    const { data: users } = await adminClient
      .from('users')
      .select('id, email, username')
      .eq('is_suspended', false)
    recipients = users?.map(u => ({ id: u.id, email: u.email, name: u.username })) || []
  } else if (audience === 'organisers') {
    const { data: orgs } = await adminClient
      .from('organisers')
      .select('id, email, org_name')
    recipients = orgs?.map(o => ({ id: o.id, email: o.email, name: o.org_name })) || []
  } else if (audience === 'verified_organisers') {
    const { data: orgs } = await adminClient
      .from('organisers')
      .select('id, email, org_name')
      .eq('is_verified', true)
    recipients = orgs?.map(o => ({ id: o.id, email: o.email, name: o.org_name })) || []
  } else if (audience === 'city' && city) {
    const { data: users } = await adminClient
      .from('users')
      .select('id, email, username')
      .ilike('city', `%${city}%`)
      .eq('is_suspended', false)
    recipients = users?.map(u => ({ id: u.id, email: u.email, name: u.username })) || []
  } else if (audience === 'individual' && user_email) {
    // Check users table first
    const { data: userRecord } = await adminClient
      .from('users')
      .select('id, email, username')
      .eq('email', user_email)
      .single()

    if (userRecord) {
      recipients = [{ id: userRecord.id, email: userRecord.email, name: userRecord.username }]
    } else {
      // Check organisers table
      const { data: orgRecord } = await adminClient
        .from('organisers')
        .select('id, email, org_name')
        .eq('email', user_email)
        .single()

      if (orgRecord) {
        recipients = [{ id: orgRecord.id, email: orgRecord.email, name: orgRecord.org_name }]
      }
    }
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients found for the selected audience' }, { status: 400 })
  }

  const userIds = recipients.map(r => r.id)

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

  // Send emails
  let emailResult: { sent: number, failed: number } | null = null
  if (channel === 'email' || channel === 'both') {
    const emailRecipients = recipients
      .filter((r): r is { id: string, email: string, name: string | null } => !!r.email)
      .map(r => ({ to: r.email, recipientName: r.name || undefined }))

    emailResult = emailRecipients.length > 0
      ? await sendAnnouncementEmails(emailRecipients, title, message)
      : { sent: 0, failed: 0 }
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
    email_sent: emailResult?.sent ?? null,
    email_failed: emailResult?.failed ?? null,
  })
}