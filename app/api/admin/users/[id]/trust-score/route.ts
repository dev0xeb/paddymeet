import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient.from('admin_team').select('department').eq('id', user.id).single()
  if (!admin || !['super_admin', 'support'].includes(admin.department)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const trustScore = Math.max(0, Math.min(100, body.trust_score))

  // Get tier thresholds
  const { data: settings } = await adminClient
    .from('platform_settings')
    .select('newbie_min, social_min, crew_min, elite_min, legendary_min')
    .eq('id', 1)
    .single()

  const thresholds = {
    Legendary: settings?.legendary_min ?? 80,
    Elite: settings?.elite_min ?? 60,
    Crew: settings?.crew_min ?? 40,
    Social: settings?.social_min ?? 20,
    Newbie: settings?.newbie_min ?? 0,
  }

  let tier = 'Newbie'
  if (trustScore >= thresholds.Legendary) tier = 'Legendary'
  else if (trustScore >= thresholds.Elite) tier = 'Elite'
  else if (trustScore >= thresholds.Crew) tier = 'Crew'
  else if (trustScore >= thresholds.Social) tier = 'Social'

  const { error } = await adminClient
    .from('users')
    .update({ trust_score: trustScore, tier })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true, tier })
}