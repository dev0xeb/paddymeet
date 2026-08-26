'use client'

import { useState } from 'react'
import { Check, Copy, CheckCheck, XCircle, Loader2, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  ticketId: string
  ticketCode: string
  currentStatus: string
}

export default function AdminTicketActions({ ticketId, ticketCode, currentStatus }: Props) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCopy = () => {
    navigator.clipboard.writeText(ticketCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleCopy}
        title="Copy Ticket Code"
        className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      {currentStatus === 'active' && (
        <button
          type="button"
          onClick={() => handleStatusChange('used')}
          disabled={loading}
          title="Mark as Used / Checked In"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
          <span>Check In</span>
        </button>
      )}

      {currentStatus === 'used' && (
        <button
          type="button"
          onClick={() => handleStatusChange('active')}
          disabled={loading}
          title="Reactivate Ticket"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold border border-slate-200 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
          <span>Reset</span>
        </button>
      )}

      {currentStatus !== 'cancelled' && (
        <button
          type="button"
          onClick={() => handleStatusChange('cancelled')}
          disabled={loading}
          title="Cancel / Invalidate Ticket"
          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
