'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Briefcase, Check, MapPin, Clock, Wallet, Upload,
  AlertCircle, FileText, X,
} from 'lucide-react'
import Logo from '@/components/brand/Logo'

interface JobField {
  id: string
  label: string
  field_type: 'text' | 'textarea'
  is_required: boolean
}

interface JobOpening {
  id: string
  title: string
  department: string | null
  location: string | null
  employment_type: string | null
  pay: string | null
  summary: string
  description: string
}

interface Props {
  opening: JobOpening
  fields: JobField[]
}

const MAX_RESUME_BYTES = 10 * 1024 * 1024

export default function JobDetailClient({ opening, fields }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [resume, setResume] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) { setResume(null); return }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['pdf', 'doc', 'docx'].includes(ext)) {
      setError('Please attach a PDF, DOC, or DOCX file')
      e.target.value = ''
      return
    }
    if (file.size > MAX_RESUME_BYTES) {
      setError('File is too large — 10MB maximum')
      e.target.value = ''
      return
    }
    setError('')
    setResume(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('Please fill in your name and email')
      return
    }
    if (!resume) {
      setError('Please attach your CV/résumé')
      return
    }
    const missingRequired = fields.some(f => f.is_required && !answers[f.id]?.trim())
    if (missingRequired) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('job_opening_id', opening.id)
      formData.append('applicant_name', name.trim())
      formData.append('applicant_email', email.trim())
      formData.append('extra_answers', JSON.stringify(
        fields.map(f => ({ label: f.label, value: answers[f.id] || '' }))
      ))
      formData.append('resume', resume)

      const res = await fetch('/api/careers/apply', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-4 py-3 bg-[rgba(255,255,255,0.04)] border border-[var(--pm-border)] rounded-xl text-sm text-[#f7efe4] outline-none focus:border-[#ff5b1e] transition-all placeholder:text-[#8c7c76]"
  const labelClass = "block text-xs font-bold text-[#b9a8a0] uppercase tracking-wider mb-1.5"

  return (
    <div className="pm-page pm-atmosphere min-h-screen">
      <div className="pm-grain" />

      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-5 sm:px-8">
        <Link href="/careers" className="flex items-center gap-2 text-[13px] font-semibold text-[#b9a8a0] hover:text-[#f7efe4] transition-colors">
          <ArrowLeft className="w-4 h-4" /> All roles
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <Logo variant="horizontal" tone="reversed" className="h-7 w-auto" />
        </Link>
        <div className="w-20" />
      </nav>

      <main className="pt-16 max-w-2xl mx-auto px-5 sm:px-8 py-14">

        {submitted ? (
          <div className="pm-card p-8 sm:p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(255,91,30,0.12)] flex items-center justify-center mx-auto mb-5">
              <Check className="w-6 h-6 text-[#ff8a52]" />
            </div>
            <h1 className="text-xl font-extrabold text-[#f7efe4] mb-2">Application sent!</h1>
            <p className="text-sm text-[#b9a8a0] leading-relaxed max-w-sm mx-auto mb-6">
              Thanks for applying to {opening.title}. We&apos;ll review your application and get back to you by email.
            </p>
            <Link href="/careers" className="pm-btn pm-btn--outline text-sm px-6 py-3 inline-flex">
              Back to all roles
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(255,255,255,0.04)] border border-[var(--pm-border)] text-[11px] font-semibold text-[#ff8a52] uppercase tracking-wider mb-4">
                <Briefcase className="w-3 h-3" /> {opening.department || 'Open role'}
              </div>
              <h1 className="pm-serif text-[clamp(28px,4.5vw,42px)] leading-tight tracking-tight mb-4">{opening.title}</h1>
              <div className="flex items-center gap-4 flex-wrap text-xs text-[#b9a8a0] mb-6">
                {opening.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#ff8a52]" />{opening.location}</span>}
                {opening.employment_type && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#ff8a52]" />{opening.employment_type}</span>}
                {opening.pay && <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-[#ff8a52]" />{opening.pay}</span>}
              </div>
              <p className="text-sm text-[#b9a8a0] leading-relaxed whitespace-pre-line">{opening.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="pm-card p-6 sm:p-8">
              <h2 className="text-base font-bold text-[#f7efe4] mb-5">Apply for this role</h2>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Full name <span className="text-[#ff5b1e]">*</span></label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email <span className="text-[#ff5b1e]">*</span></label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                </div>

                {fields.map(field => (
                  <div key={field.id}>
                    <label className={labelClass}>
                      {field.label} {field.is_required && <span className="text-[#ff5b1e]">*</span>}
                    </label>
                    {field.field_type === 'textarea' ? (
                      <textarea
                        rows={4}
                        value={answers[field.id] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className={inputClass + ' resize-none'}
                      />
                    ) : (
                      <input
                        type="text"
                        value={answers[field.id] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className={inputClass}
                      />
                    )}
                  </div>
                ))}

                <div>
                  <label className={labelClass}>CV / Résumé <span className="text-[#ff5b1e]">*</span></label>
                  {resume ? (
                    <div className="flex items-center gap-3 p-3.5 bg-[rgba(255,255,255,0.04)] border border-[var(--pm-border)] rounded-xl">
                      <FileText className="w-4 h-4 text-[#ff8a52] flex-shrink-0" />
                      <span className="text-xs text-[#f7efe4] truncate flex-1">{resume.name}</span>
                      <button type="button" onClick={() => setResume(null)} className="text-[#8c7c76] hover:text-[#f7efe4] flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-6 bg-[rgba(255,255,255,0.03)] border border-dashed border-[var(--pm-border)] rounded-xl cursor-pointer hover:border-[#ff5b1e]/50 transition-colors">
                      <Upload className="w-5 h-5 text-[#8c7c76]" />
                      <span className="text-xs text-[#b9a8a0]">PDF, DOC, or DOCX — up to 10MB</span>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                    </label>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-[rgba(255,91,30,0.1)] border border-[rgba(255,91,30,0.3)] rounded-xl text-xs text-[#ff8a52] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={submitting} className="pm-btn pm-btn--primary w-full text-sm py-3.5 disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  )
}
