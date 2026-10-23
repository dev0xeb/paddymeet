import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendApplicationStatusEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_DEPARTMENTS = ['super_admin', 'operations']

export async function POST(
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
    const { type, subject, body: emailBody } = body

    if (!['reject', 'interview'].includes(type)) {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }
    if (!subject?.trim() || !emailBody?.trim()) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    const { data: application, error: fetchError } = await adminClient
      .from('job_applications')
      .select('applicant_email')
      .eq('id', id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const emailResult = await sendApplicationStatusEmail({
      to: application.applicant_email,
      subject: subject.trim(),
      body: emailBody,
    })

    if (!emailResult.success) {
      return NextResponse.json({ error: 'Could not send the email. Please try again.' }, { status: 500 })
    }

    const { data: updated, error: updateError } = await adminClient
      .from('job_applications')
      .update({ status: type === 'reject' ? 'rejected' : 'interview_requested' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, application: updated })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
