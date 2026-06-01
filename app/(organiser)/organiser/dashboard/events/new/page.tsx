'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Step = 1 | 2 | 3 | 4

interface TicketType {
  name: string
  description: string
  price: number
  quantity: number
  is_group_ticket: boolean
  group_size: number
}

export default function SubmitEventPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [eventData, setEventData] = useState({
    title: '',
    event_type: '',
    vibe: '',
    description: '',
    age_restriction: 0,
    dress_code: '',
    capacity: 0,
    event_date: '',
    start_time: '',
    end_time: '',
    venue_name: '',
    venue_address: '',
    city: '',
    state: '',
    is_free: false,
    cancellation_policy: '',
    house_rules: '',
    website: '',
    social_link: '',
  })

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { name: 'Regular', description: '', price: 0, quantity: 100, is_group_ticket: false, group_size: 1 }
  ])

  const update = (field: string, value: string | number | boolean) =>
    setEventData(prev => ({ ...prev, [field]: value }))

  const updateTicket = (index: number, field: string, value: string | number | boolean) => {
    setTicketTypes(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t))
  }

  const addTicketType = () => {
    setTicketTypes(prev => [...prev, {
      name: '', description: '', price: 0, quantity: 50, is_group_ticket: false, group_size: 1
    }])
  }

  const removeTicketType = (index: number) => {
    if (ticketTypes.length === 1) return
    setTicketTypes(prev => prev.filter((_, i) => i !== index))
  }

  // Validation
  const step1Valid = !!(eventData.title && eventData.event_type && eventData.vibe && eventData.description)
  const step2Valid = !!(eventData.event_date && eventData.start_time && eventData.venue_name && eventData.city && eventData.state)
  const step3Valid = eventData.is_free || ticketTypes.every(t => t.name && t.price > 0 && t.quantity > 0)

  const nextStep = (current: Step, valid: boolean) => {
    if (!valid) {
      setError('Please fill in all required fields before continuing.')
      return
    }
    setError('')
    setStep((current + 1) as Step)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/organiser/submit-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventData, ticketTypes }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
      } else {
        router.push('/organiser/dashboard?submitted=true')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition-all"
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"

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

  const steps = ['Event Info', 'Date & Venue', 'Tickets', 'Final Details']

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-10 bg-white border-b border-gray-100">
        <Link href="/organiser/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="w-32" />
      </nav>

      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-24 pb-12">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Submit New Event</h1>
          <p className="text-sm text-gray-500">Fill in the details below. Paddymeet will review your event before it goes live.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {steps.map((label, i) => {
            const n = i + 1
            const isDone = step > n
            const isActive = step === n
            return (
              <div key={label} className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive ? 'bg-orange-500 text-white' :
                  isDone ? 'bg-green-50 text-green-600 border border-green-200' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {isDone ? <Check className="w-3 h-3" /> : <span>{n}</span>}
                  {label}
                </div>
                {i < steps.length - 1 && <div className={`w-4 h-px ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>

        {/* Step 1 — Event Info */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <div>
              <label className={labelClass}>Event title <span className="text-red-400">*</span></label>
              <input type="text" placeholder="e.g. Afrobeats All Night Vol. 3" value={eventData.title} onChange={e => update('title', e.target.value)} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Event type <span className="text-red-400">*</span></label>
                <select value={eventData.event_type} onChange={e => update('event_type', e.target.value)} className={inputClass + ' appearance-none'}>
                  <option value="" disabled>Select type</option>
                  {eventTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Vibe <span className="text-red-400">*</span></label>
                <select value={eventData.vibe} onChange={e => update('vibe', e.target.value)} className={inputClass + ' appearance-none'}>
                  <option value="" disabled>Select vibe</option>
                  {vibes.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Description <span className="text-red-400">*</span></label>
              <textarea
                rows={4}
                placeholder="Tell people what your event is about, who is performing, what to expect..."
                value={eventData.description}
                onChange={e => update('description', e.target.value)}
                className={inputClass + ' resize-none leading-relaxed'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Age restriction</label>
                <select value={eventData.age_restriction} onChange={e => update('age_restriction', parseInt(e.target.value))} className={inputClass + ' appearance-none'}>
                  <option value={0}>All ages</option>
                  <option value={18}>18+</option>
                  <option value={21}>21+</option>
                  <option value={25}>25+</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Expected capacity</label>
                <input type="number" placeholder="e.g. 500" value={eventData.capacity || ''} onChange={e => update('capacity', parseInt(e.target.value))} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Dress code</label>
              <input type="text" placeholder="e.g. Smart casual. No slippers." value={eventData.dress_code} onChange={e => update('dress_code', e.target.value)} className={inputClass} />
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

            <button onClick={() => nextStep(1, step1Valid)} className="w-full py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 — Date & Venue */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Event date <span className="text-red-400">*</span></label>
                <input type="date" value={eventData.event_date} onChange={e => update('event_date', e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Start time <span className="text-red-400">*</span></label>
                  <input type="time" value={eventData.start_time} onChange={e => update('start_time', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>End time</label>
                  <input type="time" value={eventData.end_time} onChange={e => update('end_time', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Venue name <span className="text-red-400">*</span></label>
              <input type="text" placeholder="e.g. Eko Hotel Grounds" value={eventData.venue_name} onChange={e => update('venue_name', e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Venue address</label>
              <input type="text" placeholder="Full address of the venue" value={eventData.venue_address} onChange={e => update('venue_address', e.target.value)} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>State <span className="text-red-400">*</span></label>
                <select
                  value={eventData.state}
                  onChange={e => { update('state', e.target.value); update('city', '') }}
                  className={inputClass + ' appearance-none'}
                >
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
                <select
                  value={eventData.city}
                  onChange={e => update('city', e.target.value)}
                  disabled={!eventData.state}
                  className={inputClass + ' appearance-none'}
                >
                  <option value="" disabled>{eventData.state ? 'Select city' : 'Select state first'}</option>
                  {(cities[eventData.state] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

            <div className="flex gap-3">
              <button onClick={() => { setError(''); setStep(1) }} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">Back</button>
              <button onClick={() => nextStep(2, step2Valid)} className="flex-1 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Tickets */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">

            {/* Free event toggle */}
            <div
              onClick={() => update('is_free', !eventData.is_free)}
              className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${eventData.is_free ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div>
                <div className="text-sm font-bold text-gray-900">This is a free event</div>
                <div className="text-xs text-gray-500">No ticket price — attendees claim a free ticket</div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-all ${eventData.is_free ? 'bg-green-500' : 'bg-gray-200'} relative`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${eventData.is_free ? 'left-7' : 'left-1'}`} />
              </div>
            </div>

            {/* Ticket types */}
            {!eventData.is_free && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Ticket types <span className="text-red-400">*</span></label>
                  <button onClick={addTicketType} className="flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add type
                  </button>
                </div>

                {ticketTypes.map((ticket, i) => (
                  <div key={i} className="border-2 border-gray-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket {i + 1}</span>
                      {ticketTypes.length > 1 && (
                        <button onClick={() => removeTicketType(i)} className="text-red-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Name <span className="text-red-400">*</span></label>
                        <input type="text" placeholder="e.g. Regular, VIP" value={ticket.name} onChange={e => updateTicket(i, 'name', e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Price (₦) <span className="text-red-400">*</span></label>
                        <input type="number" placeholder="e.g. 15000" value={ticket.price || ''} onChange={e => updateTicket(i, 'price', parseInt(e.target.value))} className={inputClass} />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Description</label>
                      <input type="text" placeholder="What does this ticket include?" value={ticket.description} onChange={e => updateTicket(i, 'description', e.target.value)} className={inputClass} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Quantity <span className="text-red-400">*</span></label>
                        <input type="number" placeholder="e.g. 100" value={ticket.quantity || ''} onChange={e => updateTicket(i, 'quantity', parseInt(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Group ticket?</label>
                        <select value={ticket.is_group_ticket ? 'yes' : 'no'} onChange={e => updateTicket(i, 'is_group_ticket', e.target.value === 'yes')} className={inputClass + ' appearance-none'}>
                          <option value="no">No — individual</option>
                          <option value="yes">Yes — group</option>
                        </select>
                      </div>
                    </div>

                    {ticket.is_group_ticket && (
                      <div>
                        <label className={labelClass}>Group size</label>
                        <input type="number" placeholder="e.g. 5" min="2" max="20" value={ticket.group_size || ''} onChange={e => updateTicket(i, 'group_size', parseInt(e.target.value))} className={inputClass} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

            <div className="flex gap-3">
              <button onClick={() => { setError(''); setStep(2) }} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">Back</button>
              <button onClick={() => nextStep(3, step3Valid)} className="flex-1 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Final Details */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">

            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-600 leading-relaxed">
                These fields are optional but help attendees know what to expect. The more detail you provide the better your event listing will look.
              </p>
            </div>

            <div>
              <label className={labelClass}>Cancellation policy</label>
              <input type="text" placeholder="e.g. Full refund up to 48 hours before the event" value={eventData.cancellation_policy} onChange={e => update('cancellation_policy', e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>House rules</label>
              <textarea rows={3} placeholder="Any specific rules for your event..." value={eventData.house_rules} onChange={e => update('house_rules', e.target.value)} className={inputClass + ' resize-none leading-relaxed'} />
            </div>

            <div>
              <label className={labelClass}>Event website</label>
              <input type="url" placeholder="https://yourwebsite.com" value={eventData.website} onChange={e => update('website', e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Social media link</label>
              <input type="url" placeholder="https://instagram.com/yourevent" value={eventData.social_link} onChange={e => update('social_link', e.target.value)} className={inputClass} />
            </div>

            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
              <div className="text-sm font-bold text-orange-700 mb-1">Before you submit</div>
              <ul className="space-y-1">
                {[
                  'Paddymeet will review your event within 24 to 48 hours',
                  'You will be notified by email once approved or if changes are needed',
                  'Events must comply with Paddymeet community guidelines',
                  'Ticket sales only begin after approval',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-orange-600">
                    <span className="w-1 h-1 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

            <div className="flex gap-3">
              <button onClick={() => { setError(''); setStep(3) }} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">Back</button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting...' : 'Submit for Review'}
                {!loading && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}