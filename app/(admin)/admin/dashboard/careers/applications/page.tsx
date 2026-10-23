'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Loader2 } from 'lucide-react'

interface Application {
  id: string
  job_title_snapshot: string
  applicant_name: string
  applicant_email: string
  status: 'new' | 'reviewing' | 'interview_requested' | 'rejected'
  created_at: string
}

const statusStyles: Record<Application['status'], string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewing: 'bg-amber-50 text-amber-700 border-amber-200',
  interview_requested: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusLabels: Record<Application['status'], string> = {
  new: 'New',
  reviewing: 'Reviewing',
  interview_requested: 'Interview requested',
  rejected: 'Rejected',
}

export default function AdminCareerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/careers/applications')
      .then(res => res.json())
      .then(data => {
        if (data.applications) setApplications(data.applications)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/dashboard/careers" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Applications</h1>
          <p className="text-xs text-slate-500">Every application submitted across all roles.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
            Loading applications...
          </div>
        ) : applications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {applications.map(app => (
              <Link
                key={app.id}
                href={`/admin/dashboard/careers/applications/${app.id}`}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-bold text-slate-900 truncate">{app.applicant_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles[app.status]}`}>
                      {statusLabels[app.status]}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {app.job_title_snapshot} · {app.applicant_email}
                  </div>
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No applications yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
