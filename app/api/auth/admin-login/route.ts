import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }

    // Verify admin_team membership using admin client (bypasses RLS issues)
    const adminClient = createAdminClient()
    const { data: adminRecord, error: adminErr } = await adminClient
      .from('admin_team')
      .select('id, department')
      .eq('id', authData.user.id)
      .single()

    if (adminErr || !adminRecord) {
      await supabase.auth.signOut()
      return NextResponse.json({ error: 'Access denied: Not an administrator account' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      department: adminRecord.department,
      redirect: '/admin/dashboard',
    })
  } catch (err) {
    console.error('Admin login error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Login failed' }, { status: 500 })
  }
}
