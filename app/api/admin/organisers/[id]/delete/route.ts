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

  if (!admin || !['super_admin', 'operations'].includes(admin.department)) {
    return NextResponse.json({ error: 'Unauthorized: Insufficient permissions to delete organisers' }, { status: 403 })
  }

  // 1. Delete from public.organisers (cascades to events, ticket_types, etc.)
  const { error } = await adminClient
    .from('organisers')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // 2. Also remove auth user from Supabase Auth
  await adminClient.auth.admin.deleteUser(id).catch(() => {})

  const isJson = request.headers.get('accept')?.includes('application/json')
  if (isJson) {
    return NextResponse.json({ success: true, message: 'Organiser deleted successfully' })
  }

  return NextResponse.redirect(new URL('/admin/dashboard/organisers', request.url))
}
