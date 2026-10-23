import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_DEPARTMENTS = ['super_admin', 'operations']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    if (!admin || !ALLOWED_DEPARTMENTS.includes(admin.department)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: application, error } = await adminClient
      .from('job_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // The resumes bucket is private — nothing is readable by a guessed
    // path, so a fresh short-lived signed URL is generated on every view
    // rather than storing one (which would eventually expire anyway).
    const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
      .from('resumes')
      .createSignedUrl(application.resume_path, 300)

    if (signedUrlError) {
      console.error('Resume signed URL failed:', signedUrlError.message)
    }

    return NextResponse.json({
      application,
      resumeUrl: signedUrlData?.signedUrl || null,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    if (!admin || !ALLOWED_DEPARTMENTS.includes(admin.department)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body
    const allowedStatuses = ['new', 'reviewing', 'interview_requested', 'rejected']
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data: updated, error } = await adminClient
      .from('job_applications')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, application: updated })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
