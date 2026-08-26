'use client'

import { useState } from 'react'
import { CheckCircle, ShieldAlert, ShieldCheck, ArrowRight, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  eventId: string
  eventTitle: string
  organiserId?: string
  organiserName?: string
  isHostVerified?: boolean
  className?: string
}

export default function AdminApproveEventButton({
  eventId,
  organiserId,
  organiserName = 'The host',
  isHostVerified = false,
  className = 'w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm'
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleDirectApprove = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/events/${eventId}/approve`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || data.error || 'Failed to approve event')
        setLoading(false)
      } else {
        setModalOpen(false)
        router.refresh()
        window.location.reload()
      }
    } catch {
      setError('An error occurred while approving the event.')
      setLoading(false)
    }
  }

  const handleVerifyHostAndApprove = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Verify Organiser if organiserId exists
      if (organiserId) {
        await fetch(`/api/admin/organisers/${organiserId}/verify`, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
        })
      }

      // 2. Approve Event with autoVerifyHost flag
      const res = await fetch(`/api/admin/events/${eventId}/approve?autoVerifyHost=true`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || data.error || 'Failed to approve event')
        setLoading(false)
      } else {
        setModalOpen(false)
        router.refresh()
        window.location.reload()
      }
    } catch {
      setError('Failed to verify host and approve event.')
      setLoading(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isHostVerified) {
      setModalOpen(true)
    } else {
      handleDirectApprove()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <CheckCircle className="w-3.5 h-3.5" />
        )}
        Approve
      </button>

      {/* Unverified Host Warning Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => { setModalOpen(false); setLoading(false) }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Host KYC Verification Required</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              This event is hosted by <strong className="text-slate-900 font-semibold">{organiserName}</strong>, whose host account is currently <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Unverified</span>.
            </p>
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-800 leading-relaxed mb-5">
              <strong>Platform Policy:</strong> To protect attendee payments and ensure legitimate events, organizers must pass KYC verification before their events can be published live.
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleVerifyHostAndApprove}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {loading ? 'Verifying & Approving...' : 'Verify Host & Approve Event Live'}
              </button>

              <Link
                href={`/admin/dashboard/organisers`}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                View Organiser KYC Details <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => { setModalOpen(false); setLoading(false) }}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
