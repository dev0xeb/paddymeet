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

  if (!admin || !['super_admin', 'operations', 'support'].includes(admin.department)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { status } = body

  if (!['active', 'used', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updateData: { status: string; attended?: boolean; attendance_marked_at?: string | null } = {
    status,
  }

  if (status === 'used') {
    updateData.attended = true
    updateData.attendance_marked_at = new Date().toISOString()
  } else if (status === 'active') {
    updateData.attended = false
    updateData.attendance_marked_at = null
  }

  const { error } = await adminClient
    .from('tickets')
    .update(updateData)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true, message: `Ticket status updated to ${status}` })
}
