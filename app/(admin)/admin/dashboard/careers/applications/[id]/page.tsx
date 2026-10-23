'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, FileWarning, Loader2, Send, X, AlertCircle, Check } from 'lucide-react'

interface Answer { label: string; value: string }

interface Application {
  id: string
  job_title_snapshot: string
  applicant_name: string
  applicant_email: string
  resume_filename: string
  extra_answers: Answer[]
  status: 'new' | 'reviewing' | 'interview_requested' | 'rejected'
  created_at: string
}

const statusLabels: Record<Application['status'], string> = {
  new: 'New',
  reviewing: 'Reviewing',
  interview_requested: 'Interview requested',
  rejected: 'Rejected',
}

function buildTemplate(type: 'reject' | 'interview', app: Application) {
  const firstName = app.applicant_name.split(' ')[0] || app.applicant_name
  if (type === 'reject') {
    return {
      subject: `Update on your application for ${app.job_title_snapshot}`,
      body: `Hi ${firstName},\n\nThank you for applying for the ${app.job_title_snapshot} role at PaddyMeet and for taking the time to share your background with us.\n\nAfter careful review, we've decided to move forward with other candidates whose experience more closely matches what we need right now. This isn't a reflection of your abilities, and we'd encourage you to apply again for future openings that fit your profile.\n\nWe wish you the very best in your search.\n\nWarm regards,\nThe PaddyMeet Team`,
    }
  }
  return {
    subject: `Let's talk — ${app.job_title_snapshot} at PaddyMeet`,
    body: `Hi ${firstName},\n\nThank you for applying for the ${app.job_title_snapshot} role at PaddyMeet. We enjoyed reviewing your application and would love to move forward with an interview.\n\nCould you reply with a couple of times that work for you this week? We'll follow up to confirm.\n\nLooking forward to speaking with you.\n\nWarm regards,\nThe PaddyMeet Team`,
  }
}

export default function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [application, setApplication] = useState<Application | null>(null)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailType, setEmailType] = useState<'reject' | 'interview' | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchApplication = () => {
    fetch(`/api/admin/careers/applications/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.application) setApplication(data.application)
        if (data.resumeUrl) setResumeUrl(data.resumeUrl)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchApplication()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const openEmailModal = (type: 'reject' | 'interview') => {
    if (!application) return
    const template = buildTemplate(type, application)
    setSubject(template.subject)
    setBody(template.body)
    setEmailType(type)
    setError('')
  }

  const sendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message are required')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/careers/applications/${id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: emailType, subject, body }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setEmailType(null)
        setSuccess(emailType === 'reject' ? 'Rejection sent' : 'Interview request sent')
        if (application) setApplication({ ...application, status: data.application.status })
        setTimeout(() => setSuccess(''), 4000)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const isPdf = application?.resume_filename.toLowerCase().endsWith('.pdf')

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 text-center text-xs text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
        Loading application...
      </div>
    )
  }

  if (!application) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 text-center">
        <p className="text-sm font-semibold text-slate-700">Application not found</p>
        <Link href="/admin/dashboard/careers/applications" className="text-xs font-bold text-orange-600 mt-2 inline-block">Back to applications</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/dashboard/careers/applications" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{application.applicant_name}</h1>
          <p className="text-xs text-slate-500">Applied for {application.job_title_snapshot} · {new Date(application.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      {success && (
        <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {statusLabels[application.status]}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Name</div>
            <div className="text-sm text-slate-900">{application.applicant_name}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</div>
            <div className="text-sm text-slate-900">{application.applicant_email}</div>
          </div>
        </div>

        {application.extra_answers.length > 0 && (
          <div className="space-y-3 mb-5 pt-4 border-t border-slate-100">
            {application.extra_answers.map((answer, i) => (
              <div key={i}>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{answer.label}</div>
                <div className="text-sm text-slate-700 whitespace-pre-line">{answer.value || '—'}</div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Résumé / CV</div>
          {resumeUrl ? (
            isPdf ? (
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <iframe src={resumeUrl} className="w-full h-[500px]" title="Résumé preview" />
                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors border-t border-slate-200">
                  <Download className="w-3.5 h-3.5" /> Open in new tab
                </a>
              </div>
            ) : (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{application.resume_filename}</div>
                  <div className="text-xs text-slate-500">Word documents open in a new tab — no inline preview</div>
                </div>
              </a>
            )
          ) : (
            <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              <FileWarning className="w-4 h-4 flex-shrink-0" /> Could not load the résumé link
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => openEmailModal('interview')}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Send Interview Request
        </button>
        <button
          type="button"
          onClick={() => openEmailModal('reject')}
          className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Send Rejection
        </button>
      </div>

      {emailType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <button onClick={() => setEmailType(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {emailType === 'reject' ? 'Send Rejection' : 'Send Interview Request'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">To {application.applicant_email} — edit before sending.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Message</label>
                <textarea
                  rows={9}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={sending}
                  className={`flex-1 py-3 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                    emailType === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {sending ? 'Sending...' : <><Send className="w-3.5 h-3.5" /> Send</>}
                </button>
                <button
                  type="button"
                  onClick={() => setEmailType(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
