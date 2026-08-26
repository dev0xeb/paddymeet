'use client'

import { useState } from 'react'
import { Download, Calendar, Filter, X, FileText, CheckCircle2 } from 'lucide-react'

interface EventItem {
  id: string
  title: string
}

interface Props {
  events: EventItem[]
}

export default function AdminFinancialExportModal({ events }: Props) {
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'custom'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [exporting, setExporting] = useState(false)

  const handleExport = () => {
    setExporting(true)
    const params = new URLSearchParams()

    if (preset === 'custom') {
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
    } else if (preset !== 'all') {
      params.set('preset', preset)
    }

    if (selectedEventId !== 'all') {
      params.set('eventId', selectedEventId)
    }

    if (selectedStatus !== 'all') {
      params.set('status', selectedStatus)
    }

    const downloadUrl = `/api/admin/reports/financial-export?${params.toString()}`
    
    // Create an invisible anchor to trigger direct browser file download
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `financial_report_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    setTimeout(() => {
      setExporting(false)
      setOpen(false)
    }, 1000)
  }

  const presets = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'custom', label: 'Custom Range' },
  ] as const

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm group"
      >
        <Download className="w-4 h-4 text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />
        <span>Export Financial Report (CSV)</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Custom Financial Export</h3>
                <p className="text-xs text-slate-500">Configure date ranges, events, and filters for your CSV export</p>
              </div>
            </div>

            <div className="space-y-4 my-5">
              {/* 1. Date Range Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  1. Select Period / Date Range
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPreset(p.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-center ${
                        preset === p.id
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Pickers */}
              {preset === 'custom' && (
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* 2. Filter by Event */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  2. Filter by Event
                </label>
                <select
                  value={selectedEventId}
                  onChange={e => setSelectedEventId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-orange-500 font-medium"
                >
                  <option value="all">🌟 All Events (Platform Wide)</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Filter by Payment Status */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  3. Payment Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-orange-500 font-medium"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="completed">Completed (Paid)</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed / Cancelled</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Generating CSV Report...' : 'Download Filtered CSV'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
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
