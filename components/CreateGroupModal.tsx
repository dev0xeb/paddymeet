'use client'

import { useState } from 'react'
import { X, Users, Ticket, ChevronDown } from 'lucide-react'
import { useGroupChat } from '@/context/GroupChatContext'

interface TicketType {
  id: string
  name: string
  price: number
  is_group_ticket: boolean
}

interface Props {
  eventId: string
  eventTitle: string
  ticketTypes: TicketType[]
  userTicketTypeId?: string
}

export default function CreateGroupModal({ eventId, eventTitle, ticketTypes, userTicketTypeId }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { openGroup } = useGroupChat()

  const [form, setForm] = useState({
    name: '',
    description: '',
    vibe: '',
    group_type: 'social' as 'social' | 'ticket',
    ticket_type_id: userTicketTypeId || '',
    max_members: 20,
    gender_preference: 'any',
    min_trust_score: 0,
  })

  const vibes = ['Chill', 'Turnt', 'Exclusive', 'Social', 'Wild', 'Classy', 'Romantic', 'Cultural']
  const genderOptions = [
    { value: 'any', label: 'Anyone' },
    { value: 'male', label: 'Males only' },
    { value: 'female', label: 'Females only' },
    { value: 'mixed', label: 'Mixed (balanced)' },
  ]

  const update = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Please enter a group name'); return }
    if (form.group_type === 'ticket' && !form.ticket_type_id) { setError('Please select a ticket type'); return }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, event_id: eventId }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setOpen(false)
        setForm({
          name: '', description: '', vibe: '', group_type: 'social',
          ticket_type_id: userTicketTypeId || '', max_members: 20,
          gender_preference: 'any', min_trust_score: 0,
        })
        setStep(1)
        // Open the new group chat
        openGroup({
          id: data.group.id,
          name: data.group.name,
          event_title: eventTitle,
        })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition-all"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 border border-orange-200 text-orange-500 text-xs font-bold rounded-full hover:bg-orange-100 transition-colors"
      >
        <Users className="w-3.5 h-3.5" /> Create Group
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Create a Group</h2>
                <p className="text-xs text-gray-500">{eventTitle}</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">

              {/* Step 1 — Group type */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Group Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => update('group_type', 'social')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          form.group_type === 'social' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Users className={`w-5 h-5 mb-2 ${form.group_type === 'social' ? 'text-orange-500' : 'text-gray-400'}`} />
                        <div className={`text-sm font-bold ${form.group_type === 'social' ? 'text-orange-600' : 'text-gray-900'}`}>Social Group</div>
                        <div className="text-xs text-gray-500 mt-0.5">Open to anyone attending the event</div>
                      </button>
                      <button
                        onClick={() => update('group_type', 'ticket')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          form.group_type === 'ticket' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Ticket className={`w-5 h-5 mb-2 ${form.group_type === 'ticket' ? 'text-orange-500' : 'text-gray-400'}`} />
                        <div className={`text-sm font-bold ${form.group_type === 'ticket' ? 'text-orange-600' : 'text-gray-900'}`}>Ticket Group</div>
                        <div className="text-xs text-gray-500 mt-0.5">Only for a specific ticket type</div>
                      </button>
                    </div>
                  </div>

                  {form.group_type === 'ticket' && ticketTypes.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ticket Type</label>
                      <select value={form.ticket_type_id} onChange={e => update('ticket_type_id', e.target.value)} className={inputClass + ' appearance-none'}>
                        <option value="" disabled>Select ticket type</option>
                        {ticketTypes.map(t => (
                          <option key={t.id} value={t.id}>{t.name} — ₦{t.price.toLocaleString()}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Group Name *</label>
                    <input type="text" placeholder="e.g. Lagos Girls Squad, VIP Crew..." value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} maxLength={40} />
                    <div className="text-xs text-gray-400 mt-1 text-right">{form.name.length}/40</div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                    <textarea rows={2} placeholder="What is this group about?" value={form.description} onChange={e => update('description', e.target.value)} className={inputClass + ' resize-none'} maxLength={120} />
                  </div>

                  <button
                    onClick={() => {
                      if (!form.name.trim()) { setError('Please enter a group name'); return }
                      if (form.group_type === 'ticket' && !form.ticket_type_id) { setError('Please select a ticket type'); return }
                      setError('')
                      setStep(2)
                    }}
                    className="w-full py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    Next — Set Preferences
                  </button>
                </div>
              )}

              {/* Step 2 — Preferences */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vibe</label>
                    <div className="flex flex-wrap gap-2">
                      {vibes.map(v => (
                        <button key={v} onClick={() => update('vibe', v)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            form.vibe === v ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max Members</label>
                      <div className="relative">
                        <select value={form.max_members} onChange={e => update('max_members', parseInt(e.target.value))} className={inputClass + ' appearance-none pr-8'}>
                          {[5, 10, 15, 20, 30, 50].map(n => (
                            <option key={n} value={n}>{n} people</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
                      <div className="relative">
                        <select value={form.gender_preference} onChange={e => update('gender_preference', e.target.value)} className={inputClass + ' appearance-none pr-8'}>
                          {genderOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Min Trust Score <span className="text-gray-400 font-normal normal-case">(0 = everyone welcome)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input type="range" min={0} max={100} step={10} value={form.min_trust_score} onChange={e => update('min_trust_score', parseInt(e.target.value))} className="flex-1 accent-orange-500" />
                      <span className="text-sm font-bold text-gray-900 w-8">{form.min_trust_score}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {form.min_trust_score === 0 ? 'Anyone can join' : `Only users with trust score ≥ ${form.min_trust_score}`}
                    </div>
                  </div>

                  {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

                  <div className="flex gap-3">
                    <button onClick={() => { setStep(1); setError('') }} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">
                      Back
                    </button>
                    <button onClick={handleCreate} disabled={saving} className="flex-1 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                      {saving ? 'Creating...' : 'Create Group'}
                    </button>
                  </div>
                </div>
              )}

              {error && step === 1 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}