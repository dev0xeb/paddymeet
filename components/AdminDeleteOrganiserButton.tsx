'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  organiserId: string
  organiserName: string
  organiserEmail: string
  className?: string
}

export default function AdminDeleteOrganiserButton({
  organiserId,
  organiserName,
  organiserEmail,
  className = 'flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl hover:bg-rose-100 transition-colors'
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/organisers/${organiserId}/delete`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || data.error || 'Failed to delete organiser')
        setLoading(false)
      } else {
        setModalOpen(false)
        router.refresh()
        window.location.reload()
      }
    } catch {
      setError('An error occurred while deleting the organiser.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={className}
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative text-left">
            <button
              onClick={() => { setModalOpen(false); setLoading(false) }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Organiser Account</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Are you sure you want to permanently delete <strong className="text-slate-900 font-semibold">{organiserName}</strong> ({organiserEmail})?
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 leading-relaxed mb-5">
              <strong>Warning:</strong> This action cannot be undone. All unpublished draft events, tickets, and organiser host profiles will be permanently removed.
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 mb-4">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-all shadow-sm disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {loading ? 'Deleting...' : 'Yes, Permanently Delete Organiser'}
              </button>

              <button
                type="button"
                onClick={() => { setModalOpen(false); setLoading(false) }}
                className="w-full py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors"
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
