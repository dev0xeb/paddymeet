'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

interface EventData {
  title: string
  event_type: string
  vibe: string
  description: string
  age_restriction: number
  dress_code: string
  capacity: number
  event_date: string
  start_time: string
  end_time: string
  venue_name: string
  venue_address: string
  city: string
  state: string
  cancellation_policy: string
  house_rules: string
  website: string
  social_link: string
}

async function getEvent(id: string): Promise<EventData | null> {
  try {
    const res = await fetch(`/api/organiser/events/${id}`)
    const data = await res.json()
    return data.event || null
  } catch {
    return null
  }
}

const eventTypes = ['Concert', 'Club Night', 'Festival', 'Day Party', 'Lounge', 'Comedy Show', 'Arts & Culture', 'Rave', 'Sports Event', 'Food & Drinks']
const vibes = ['Turnt', 'Chill', 'Exclusive', 'Wild', 'Social', 'Cultural', 'Classy', 'Romantic']
const cities: Record<string, string[]> = {
  lagos: ['Lagos Island', 'Victoria Island', 'Lekki', 'Ikeja', 'Surulere', 'Yaba', 'Ajah', 'Ikoyi', 'Other'],
  abuja: ['Central Business District', 'Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Other'],
  rivers: ['Port Harcourt', 'Obio-Akpor', 'Other'],
  oyo: ['Ibadan', 'Ogbomosho', 'Other'],
  delta: ['Warri', 'Asaba', 'Other'],
  enugu: ['Enugu', 'Nsukka', 'Other'],
  anambra: ['Awka', 'Onitsha', 'Nnewi', 'Other'],
  kano: ['Kano City', 'Other'],
  edo: ['Benin City', 'Auchi', 'Other'],
}

export default function EditEventPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [event, setEvent] = useState<EventData | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getEvent(id).then(data => {
      if (data) setEvent(data)
      setLoaded(true)
    })
  }, [id])

  const update = (field: string, value: string | number) => {
    setEvent(prev => prev ? { ...prev, [field]: value } : prev)
  }

  const handleSave = async () => {
    if (!event?.title || !event?.event_type || !event?.event_date || !event?.venue_name) {
      setError('Please fill in all required fields')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/organiser/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        router.push(`/organiser/dashboard/events/${id}?updated=true`)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-blue-400 focus:bg-white transition-all"
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href={`/organiser/dashboard/events/${id}`} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Event
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Edit Event
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="w-24" />
      </nav>

      <div className="pt-16 max-w-3xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Edit Event</h1>
          <p className="text-sm text-gray-500">Any changes will require Paddymeet to re-review your event before it goes live again.</p>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl mb-6">
          <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-orange-700 mb-0.5">Re-review required</div>
            <p className="text-xs text-orange-600 leading-relaxed">
              Saving changes will set your event back to pending review. Paddymeet will review the updated event within 24-48 hours before it goes live again.
            </p>
          </div>
        </div>

        {!loaded ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !event ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-sm text-gray-400">Event not found</p>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Basic info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="text-sm font-extrabold text-gray-900">Basic Information</h2>

              <div>
                <label className={labelClass}>Event title <span className="text-red-400">*</span></label>
                <input type="text" value={event.title} onChange={e => update('title', e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Event type <span className="text-red-400">*</span></label>
                  <select value={event.event_type} onChange={e => update('event_type', e.target.value)} className={inputClass + ' appearance-none'}>
                    <option value="" disabled>Select type</option>
                    {eventTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Vibe</label>
                  <select value={event.vibe} onChange={e => update('vibe', e.target.value)} className={inputClass + ' appearance-none'}>
                    <option value="" disabled>Select vibe</option>
                    {vibes.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea rows={4} value={event.description} onChange={e => update('description', e.target.value)} className={inputClass + ' resize-none leading-relaxed'} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Age restriction</label>
                  <select value={event.age_restriction} onChange={e => update('age_restriction', parseInt(e.target.value))} className={inputClass + ' appearance-none'}>
                    <option value={0}>All ages</option>
                    <option value={18}>18+</option>
                    <option value={21}>21+</option>
                    <option value={25}>25+</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Capacity</label>
                  <input type="number" value={event.capacity || ''} onChange={e => update('capacity', parseInt(e.target.value))} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Dress code</label>
                <input type="text" value={event.dress_code || ''} onChange={e => update('dress_code', e.target.value)} className={inputClass} />
              </div>
            </div>

            {/* Date & venue */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="text-sm font-extrabold text-gray-900">Date & Venue</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Event date <span className="text-red-400">*</span></label>
                  <input type="date" value={event.event_date} onChange={e => update('event_date', e.target.value)} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Start time</label>
                    <input type="time" value={event.start_time} onChange={e => update('start_time', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>End time</label>
                    <input type="time" value={event.end_time || ''} onChange={e => update('end_time', e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Venue name <span className="text-red-400">*</span></label>
                <input type="text" value={event.venue_name} onChange={e => update('venue_name', e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Venue address</label>
                <input type="text" value={event.venue_address || ''} onChange={e => update('venue_address', e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>State <span className="text-red-400">*</span></label>
                  <select value={event.state} onChange={e => { update('state', e.target.value); update('city', '') }} className={inputClass + ' appearance-none'}>
                    <option value="" disabled>Select state</option>
                    <option value="lagos">Lagos</option>
                    <option value="abuja">Abuja (FCT)</option>
                    <option value="rivers">Rivers</option>
                    <option value="oyo">Oyo</option>
                    <option value="delta">Delta</option>
                    <option value="enugu">Enugu</option>
                    <option value="anambra">Anambra</option>
                    <option value="kano">Kano</option>
                    <option value="edo">Edo</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>City <span className="text-red-400">*</span></label>
                  <select value={event.city} onChange={e => update('city', e.target.value)} disabled={!event.state} className={inputClass + ' appearance-none'}>
                    <option value="" disabled>{event.state ? 'Select city' : 'Select state first'}</option>
                    {(cities[event.state] || []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="text-sm font-extrabold text-gray-900">Additional Information</h2>

              <div>
                <label className={labelClass}>Cancellation policy</label>
                <input type="text" value={event.cancellation_policy || ''} onChange={e => update('cancellation_policy', e.target.value)} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>House rules</label>
                <textarea rows={3} value={event.house_rules || ''} onChange={e => update('house_rules', e.target.value)} className={inputClass + ' resize-none leading-relaxed'} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="url" value={event.website || ''} onChange={e => update('website', e.target.value)} placeholder="https://" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Social link</label>
                  <input type="url" value={event.social_link || ''} onChange={e => update('social_link', e.target.value)} placeholder="https://" className={inputClass} />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}

            <div className="flex gap-3">
              <Link href={`/organiser/dashboard/events/${id}`}
                className="flex-1 flex items-center justify-center py-3.5 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">
                Cancel
              </Link>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {saving ? 'Saving...' : 'Save & Submit for Review'}
                {!saving && <Save className="w-4 h-4" />}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}