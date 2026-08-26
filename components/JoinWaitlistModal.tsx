'use client'

import { useState } from 'react'
import { X, Clock, CheckCircle2, ArrowRight, BellRing } from 'lucide-react'

interface Props {
  eventId: string
  eventTitle: string
  ticketTypeName?: string
  ticketTypeId?: string
  userEmail?: string
  onClose: () => void
}

export default function JoinWaitlistModal({
  eventId,
  eventTitle,
  ticketTypeName,
  ticketTypeId,
  userEmail = '',
  onClose,
}: Props) {
  const [email, setEmail] = useState(userEmail)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [position, setPosition] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/events/${eventId}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim() || undefined,
          ticket_type_id: ticketTypeId,
        }),
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setPosition(data.position)
        setSuccessMessage(data.message)
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 md:p-8 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {position !== null ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500 animate-bounce" />
            </div>
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Queue Position #{position}
            </span>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">You&apos;re on the Waitlist!</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              {successMessage || `We've saved your spot for ${eventTitle}. If tickets open up due to refunds or holds, you'll be the first to receive a private claim link.`}
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-4">
              <BellRing className="w-6 h-6 text-orange-500" />
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight mb-1">
              Join Sold-Out Waitlist
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              {ticketTypeName ? `${ticketTypeName} for ` : ''}<span className="font-bold text-gray-700">{eventTitle}</span> is currently at capacity.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Phone Number (Optional for SMS alert)
                </label>
                <input
                  type="tel"
                  placeholder="08012345678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-500 transition-all"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                {loading ? 'Joining Queue...' : <>Save My Spot <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
