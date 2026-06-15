'use client'

import { useState } from 'react'
import { Copy, Check, FileText } from 'lucide-react'

interface Organiser {
  org_name: string
}

interface EventItem {
  id: string
  title: string
  event_date: string
  city: string
  state: string
  event_type: string
  vibe: string
  organisers: Organiser | Organiser[] | null
}

export default function ScannerReportGenerator({ events }: { events: EventItem[] }) {
  const [copied, setCopied] = useState(false)

  const buildReport = () => {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    let report = `Paddymeet Event Outreach Report\nGenerated: ${today}\n\n`
    report += `${events.length} live event(s) in the next 14 days:\n\n`

    events.forEach((event, i) => {
      const org = Array.isArray(event.organisers) ? event.organisers[0] : event.organisers
      report += `${i + 1}. ${event.title}\n`
      report += `   Organiser: ${org?.org_name || 'Unknown'}\n`
      report += `   Date: ${event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBC'}\n`
      report += `   Location: ${event.city || ''}${event.state ? `, ${event.state}` : ''}\n`
      report += `   Type: ${event.event_type || '—'} · Vibe: ${event.vibe || '—'}\n\n`
    })

    report += `\nSuggested outreach actions:\n`
    report += `- Reach out to organisers above for promotional content (flyers, reels, stories)\n`
    report += `- Cross-post top events on Paddymeet social channels\n`
    report += `- Consider featuring high-engagement events on the homepage\n`

    return report
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(buildReport())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-pink-500" /> Outreach Report
        </h2>
        <button
          onClick={handleCopy}
          disabled={events.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Report</>}
        </button>
      </div>

      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event, i) => {
            const org = Array.isArray(event.organisers) ? event.organisers[0] : event.organisers
            return (
              <div key={event.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-xs font-bold text-pink-500 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{event.title}</div>
                  <div className="text-xs text-gray-500">
                    {org?.org_name || 'Unknown'} · {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'} · {event.city || '—'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-sm text-gray-400">No upcoming events in the next 14 days</p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Click &quot;Copy Report&quot; to generate a text summary for your outreach checklist, sent to relevant teams every 1–2 weeks.
      </p>
    </div>
  )
}