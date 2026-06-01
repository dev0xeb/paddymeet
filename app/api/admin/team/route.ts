import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team').select('department').eq('id', user.id).single()

  if (!admin || admin.department !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can manage the team' }, { status: 403 })
  }

  const { data: team } = await adminClient
    .from('admin_team')
    .select('*')
    .order('created_at', { ascending: true })

  return NextResponse.json({ team })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team').select('department').eq('id', user.id).single()

  if (!admin || admin.department !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can add team members' }, { status: 403 })
  }

  const body = await request.json()
  const { full_name, email, password, department } = body

  if (!full_name || !email || !password || !department) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, account_type: 'admin' }
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  if (!authData.user) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 400 })
  }

  const { error: teamError } = await adminClient
    .from('admin_team')
    .insert({
      id: authData.user.id,
      full_name,
      email,
      department,
      is_active: true,
      created_by: user.id,
    })

  if (teamError) {
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: teamError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}