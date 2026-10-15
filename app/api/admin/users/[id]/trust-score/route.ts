import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getTierThresholds, tierForScore, MAX_TRUST_SCORE } from '@/lib/trustScore'
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
  const rawScore = Number(body.trust_score)
  if (!Number.isFinite(rawScore)) {
    return NextResponse.json({ error: 'trust_score must be a number' }, { status: 400 })
  }
  const trustScore = Math.max(0, Math.min(MAX_TRUST_SCORE, rawScore))

  const thresholds = await getTierThresholds(adminClient)
  const tier = tierForScore(trustScore, thresholds)

  const { error } = await adminClient
    .from('users')
    .update({ trust_score: trustScore, tier })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true, tier })
}