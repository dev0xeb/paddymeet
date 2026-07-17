'use client'

import { useState } from 'react'
import { Play, Check, Loader2 } from 'lucide-react'

export default function ProcessGroupDeadlinesButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean, message: string } | null>(null)

  const handleProcess = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/cron/process-group-deadlines', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`,
        },
      })
      const data = await res.json()
      if (data.success) {
        const r = data.results?.[0]
        if (!r) {
          setResult({ success: true, message: data.message || 'No expired group deadlines found' })
        } else {
          setResult({
            success: true,
            message: `Done — ${r.groups_completed} group(s) completed, ${r.groups_merged} merged, ${r.leftover_members} leftover member(s) notified`,
          })
        }
      } else {
        setResult({ success: false, message: data.error || 'Something went wrong' })
      }
    } catch {
      setResult({ success: false, message: 'Network error — check logs' })
    }
    setLoading(false)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h3 className="text-sm font-extrabold text-gray-900 mb-1">Group Deadline Processor</h3>
      <p className="text-xs text-gray-500 mb-4">
        Runs automatically every hour via cron. Click to trigger manually for testing — merges incomplete groups smallest-first, issues tickets to completed groups, and notifies leftover members.
      </p>

      <button
        onClick={handleProcess}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
          : <><Play className="w-4 h-4" /> Process Now</>}
      </button>

      {result && (
        <div className={`mt-4 p-3 rounded-xl text-sm flex items-start gap-2 ${result.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
          {result.success && <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          {result.message}
        </div>
      )}
    </div>
  )
}