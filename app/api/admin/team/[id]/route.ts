import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// DELETE — remove team member
export async function DELETE(
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
    return NextResponse.json({ error: 'Only super admins can remove team members' }, { status: 403 })
  }

  // Prevent removing yourself
  if (id === user.id) {
    return NextResponse.json({ error: 'You cannot remove your own account' }, { status: 400 })
  }

  // Check target is not super_admin
  const { data: target } = await adminClient
    .from('admin_team').select('department').eq('id', id).single()

  if (target?.department === 'super_admin') {
    return NextResponse.json({ error: 'Cannot remove a super admin account' }, { status: 400 })
  }

  // Remove from admin_team
  const { error } = await adminClient
    .from('admin_team')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}