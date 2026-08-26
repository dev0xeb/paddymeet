'use client'

import { useState } from 'react'
import { Plus, X, Users, Sparkles, Check, ChevronRight, Share2, MapPin, Calendar, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useGroupChat } from '@/context/GroupChatContext'

interface LiveEvent {
  id: string
  title: string
  event_date: string
  start_time: string
  venue_name: string
  city: string
  vibe?: string
  ticket_types?: {
    id: string
    name: string
    price: number
    is_group_ticket: boolean
    group_size: number
  }[]
}

interface Props {
  liveEvents: LiveEvent[]
}

export default function StartSquadModal({ liveEvents }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [squadName, setSquadName] = useState('')
  const [squadVibe, setSquadVibe] = useState('Turnt')
  const [maxMembers, setMaxMembers] = useState(6)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { openGroup } = useGroupChat()

  const selectedEvent = liveEvents.find(e => e.id === selectedEventId)
  const vibes = ['Turnt', 'Chill', 'Exclusive', 'Social', 'Afrobeats', 'Rave', 'VIP Table']

  const handleCreate = async () => {
    if (!selectedEventId) {
      setError('Please select an event')
      return
    }
    if (!squadName.trim()) {
      setError('Please enter a squad name')
      return
    }

    setCreating(true)
    setError('')

    try {
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEventId,
          name: squadName.trim(),
          vibe: squadVibe,
          max_members: maxMembers,
          group_type: 'social',
          gender_preference: 'any',
          min_trust_score: 0,
        }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setOpen(false)
        setSquadName('')
        setStep(1)
        router.refresh()

        if (data.group) {
          openGroup({
            id: data.group.id,
            name: data.group.name,
            event_title: selectedEvent?.title || 'Event',
          })
        }
      }
    } catch {
      setError('Failed to create squad. Please try again.')
    }
    setCreating(false)
  }

  const inputClass =
    'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 transition-all'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-sm shadow-orange-600/20 active:scale-[0.98] transition-all"
      >
        <Plus className="w-4 h-4" /> Start a New Squad
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Start an Event Squad</h3>
                  <p className="text-xs text-slate-500">Coordinate and party with friends</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>{error}</span>
                  {selectedEventId && error.toLowerCase().includes('ticket') && (
                    <a
                      href={`/events/${selectedEventId}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 underline self-start sm:self-auto"
                    >
                      Get Ticket for {selectedEvent?.title || 'Event'} →
                    </a>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Step 1: Select Event
                  </label>

                  {liveEvents.length > 0 ? (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {liveEvents.map((evt) => {
                        const isSelected = selectedEventId === evt.id
                        return (
                          <div
                            key={evt.id}
                            onClick={() => setSelectedEventId(evt.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50/30 ring-2 ring-orange-500/20'
                                : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/50'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900 truncate">{evt.title}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{evt.event_date ? new Date(evt.event_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : 'TBD'}</span>
                                <span>•</span>
                                <span>{evt.city}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No approved events available right now.</p>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!selectedEventId}
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                    >
                      Next Step <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Step 2: Squad Details
                    </label>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-orange-600 hover:underline"
                    >
                      Change Event
                    </button>
                  </div>

                  {selectedEvent && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                      Event: <span className="font-bold text-slate-900">{selectedEvent.title}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Squad Name</label>
                    <input
                      type="text"
                      value={squadName}
                      onChange={(e) => setSquadName(e.target.value)}
                      placeholder="e.g. VIP Table Crew, Mainland Party Squad..."
                      className={inputClass}
                      maxLength={40}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Squad Vibe</label>
                    <div className="flex flex-wrap gap-2">
                      {vibes.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSquadVibe(v)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            squadVibe === v
                              ? 'bg-orange-600 text-white border-orange-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Max Members</label>
                    <select
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(Number(e.target.value))}
                      className={inputClass}
                    >
                      {[4, 6, 8, 10, 15, 20].map((num) => (
                        <option key={num} value={num}>
                          {num} Members Table
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={creating || !squadName.trim()}
                      onClick={handleCreate}
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                    >
                      {creating ? 'Creating...' : 'Create & Launch Squad'}
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </>
  )
}
