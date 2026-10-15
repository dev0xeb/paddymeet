import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// Recovery path for a lost authenticator device: Supabase's TOTP factors
// don't come with backup codes, so without this, losing the device means
// permanent lockout from the entire admin panel. A super admin clears the
// factor on the locked-out admin's behalf — they re-enroll a new one from
// Settings the next time they sign in.
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
    .from('admin_team').select('department').eq('id', user.id).single()

  if (!admin || admin.department !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can reset two-factor authentication' }, { status: 403 })
  }

  const { data: factorData, error: listError } = await adminClient.auth.admin.mfa.listFactors({ userId: id })
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 400 })
  }

  for (const factor of factorData.factors) {
    const { error: deleteError } = await adminClient.auth.admin.mfa.deleteFactor({ id: factor.id, userId: id })
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ success: true })
}
