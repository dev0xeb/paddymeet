import { createAdminClient } from '@/lib/supabase-admin'
import { sendJobApplicationNotification } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

const MAX_RESUME_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx']

// Public, unauthenticated by design — applying never requires an account.
// Every write goes through the service-role client since there's no
// session to scope an RLS policy to.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const jobOpeningId = formData.get('job_opening_id')?.toString()
    const applicantName = formData.get('applicant_name')?.toString()?.trim()
    const applicantEmail = formData.get('applicant_email')?.toString()?.trim()
    const extraAnswersRaw = formData.get('extra_answers')?.toString()
    const resume = formData.get('resume')

    if (!jobOpeningId || !applicantName || !applicantEmail) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 })
    }

    if (!(resume instanceof File) || resume.size === 0) {
      return NextResponse.json({ error: 'Please attach your CV/résumé' }, { status: 400 })
    }

    if (resume.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: 'Résumé file is too large (max 10MB)' }, { status: 400 })
    }

    const extension = resume.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ error: 'Résumé must be a PDF, DOC, or DOCX file' }, { status: 400 })
    }

    let extraAnswers: { label: string; value: string }[] = []
    if (extraAnswersRaw) {
      try {
        const parsed = JSON.parse(extraAnswersRaw)
        if (Array.isArray(parsed)) extraAnswers = parsed
      } catch {
        // Malformed JSON from a tampered request — ignore rather than fail
        // the whole application over optional extra fields.
      }
    }

    const adminClient = createAdminClient()

    // Never trust that the role is still open just because the applicant
    // reached this form — it could've been unpublished since they loaded
    // the page, or the id could be a guess.
    const { data: opening, error: openingError } = await adminClient
      .from('job_openings')
      .select('id, title, is_published')
      .eq('id', jobOpeningId)
      .single()

    if (openingError || !opening || !opening.is_published) {
      return NextResponse.json({ error: 'This role is no longer accepting applications' }, { status: 400 })
    }

    // Required-field check against what the admin actually configured for
    // this role, not just whatever the client happened to send.
    const { data: fields } = await adminClient
      .from('job_application_fields')
      .select('label, is_required')
      .eq('job_opening_id', jobOpeningId)

    const answeredLabels = new Set(extraAnswers.map(a => a.label))
    const missingRequired = (fields || []).some(f => f.is_required && !answeredLabels.has(f.label))
    if (missingRequired) {
      return NextResponse.json({ error: 'Please fill in all required fields' }, { status: 400 })
    }

    const resumePath = `applications/${jobOpeningId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
    const resumeBuffer = Buffer.from(await resume.arrayBuffer())

    const { error: uploadError } = await adminClient.storage
      .from('resumes')
      .upload(resumePath, resumeBuffer, {
        contentType: resume.type || undefined,
        upsert: false,
      })

    if (uploadError) {
      console.error('Résumé upload failed:', uploadError.message)
      return NextResponse.json({ error: 'Could not upload your résumé. Please try again.' }, { status: 500 })
    }

    const { data: application, error: insertError } = await adminClient
      .from('job_applications')
      .insert({
        job_opening_id: jobOpeningId,
        job_title_snapshot: opening.title,
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        resume_path: resumePath,
        resume_filename: resume.name,
        extra_answers: extraAnswers,
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Best-effort — the applicant's submission already succeeded and is
    // safely in the database; a notification-email hiccup shouldn't turn
    // into a failed application from their side.
    try {
      await sendJobApplicationNotification({
        jobTitle: opening.title,
        applicantName,
        applicantEmail,
        applicationId: application.id,
      })
    } catch (err) {
      console.error('Job application notification failed:', err)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
