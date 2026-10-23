import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

const ALLOWED_DEPARTMENTS = ['super_admin', 'operations']

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminClient = createAdminClient()
    const { data: admin } = await adminClient
      .from('admin_team')
      .select('department')
      .eq('id', user.id)
      .single()

    if (!admin || !ALLOWED_DEPARTMENTS.includes(admin.department)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: applications, error } = await adminClient
      .from('job_applications')
      .select('id, job_title_snapshot, applicant_name, applicant_email, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ applications: applications || [] })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
