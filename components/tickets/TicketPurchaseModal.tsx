'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Minus, Check, ArrowRight, Ticket, Download, FileText, User as UserIcon } from 'lucide-react'
import { downloadTicketImage, downloadTicketPDF } from '@/lib/ticketImage'

interface TicketType {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  quantity_sold: number
  is_group_ticket: boolean
  group_size: number
}

interface Event {
  id: string
  title: string
  event_date: string
  start_time: string
  venue_name: string
  is_free: boolean
}

interface User {
  id: string
  email: string
  referral_discount_percent?: number
}

interface Props {
  event: Event
  ticketType: TicketType
  user: User
  onClose: () => void
}

interface PaystackWindow extends Window {
  PaystackPop: {
    setup: (config: Record<string, unknown>) => { openIframe: () => void }
  }
}

interface AttendeeInput {
  name: string
  email: string
  phone: string
}

interface ConfirmedTicket {
  ticket_code: string
  attendee_name?: string
}

type Step = 'select' | 'details' | 'summary' | 'processing' | 'confirmed'

export default function TicketPurchaseModal({ event, ticketType, user, onClose }: Props) {
  const [step, setStep] = useState<Step>('select')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmedTickets, setConfirmedTickets] = useState<ConfirmedTicket[]>([])
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null)
  const [savedCode, setSavedCode] = useState<string | null>(null)
  const paystackReady = useRef(false)

  // Buyer + attendee details
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [sendToMeOnly, setSendToMeOnly] = useState(true)
  const [attendees, setAttendees] = useState<AttendeeInput[]>([])
  const [detailsError, setDetailsError] = useState('')

  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState<{ code: string, discount_type: string, discount_value: number } | null>(null)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)

  const discountPercent = user.referral_discount_percent || 0
  const subtotal = ticketType.price * quantity
  const referralDiscountAmount = Math.round(subtotal * (discountPercent / 100))

  const promoDiscountAmount = promoApplied
    ? promoApplied.discount_type === 'percentage'
      ? Math.round(subtotal * (promoApplied.discount_value / 100))
      : Math.min(promoApplied.discount_value, subtotal)
    : 0

  const totalDiscount = referralDiscountAmount + promoDiscountAmount
  const discountedSubtotal = Math.max(0, subtotal - totalDiscount)
  const serviceFee = Math.round(discountedSubtotal * 0.05)
  const total = discountedSubtotal + serviceFee

  const extraAttendeeCount = Math.max(0, quantity - 1)

  // Keep attendees array length in sync with quantity
  useEffect(() => {
    setAttendees(prev => {
      const next = [...prev]
      while (next.length < extraAttendeeCount) next.push({ name: '', email: '', phone: '' })
      while (next.length > extraAttendeeCount) next.pop()
      return next
    })
  }, [extraAttendeeCount])

  // Load Paystack script once on mount
  useEffect(() => {
    const pw = window as unknown as PaystackWindow
    if (pw.PaystackPop) {
      paystackReady.current = true
      return
    }
    const existing = document.getElementById('paystack-script')
    if (existing) {
      existing.addEventListener('load', () => { paystackReady.current = true })
      return
    }
    const script = document.createElement('script')
    script.id = 'paystack-script'
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => { paystackReady.current = true }
    document.head.appendChild(script)
  }, [])

  const handleApplyPromo = async () => {
    setPromoLoading(true)
    setPromoError('')
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode }),
      })
      const data = await res.json()
      if (data.error) {
        setPromoError(data.error)
      } else {
        setPromoApplied({ code: data.code, discount_type: data.discount_type, discount_value: data.discount_value })
      }
    } catch {
      setPromoError('Could not validate code. Please try again.')
    }
    setPromoLoading(false)
  }

  const validateDetails = () => {
    if (!buyerName.trim()) { setDetailsError('Please enter your full name'); return false }
    if (!buyerPhone.trim()) { setDetailsError('Please enter your phone number'); return false }
    if (!sendToMeOnly) {
      for (const a of attendees) {
        if (!a.name.trim()) { setDetailsError('Please fill in all attendee names, or choose to send all tickets to your email only'); return false }
      }
    }
    setDetailsError('')
    return true
  }

  const buildAttendeesPayload = () => {
    // First attendee is always the buyer
    const list: AttendeeInput[] = [{ name: buyerName, email: user.email, phone: buyerPhone }]
    if (sendToMeOnly) {
      for (let i = 0; i < extraAttendeeCount; i++) {
        list.push({ name: buyerName, email: user.email, phone: buyerPhone })
      }
    } else {
      attendees.forEach(a => {
        list.push({
          name: a.name || buyerName,
          email: a.email || user.email,
          phone: a.phone || buyerPhone,
        })
      })
    }
    return list
  }

  const verifyPayment = async (reference: string) => {
    try {
      const res = await fetch('/api/tickets/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          event_id: event.id,
          ticket_type_id: ticketType.id,
          quantity,
          user_id: user.id,
          discount_applied: discountPercent,
          promo_code: promoApplied?.code || null,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          attendees: buildAttendeesPayload(),
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(`Ticket creation failed: ${data.error}`)
        setStep('summary')
      } else if (data.tickets) {
        setConfirmedTickets(data.tickets)
        setStep('confirmed')
      } else {
        setError('Unexpected response. Please contact support.')
        setStep('summary')
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown'}`)
      setStep('summary')
    }
    setLoading(false)
  }

  const handlePaystack = () => {
    setLoading(true)
    setError('')

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!publicKey) {
      setError('Payment configuration error.')
      setLoading(false)
      return
    }

    const pw = window as unknown as PaystackWindow
    if (!pw.PaystackPop) {
      setError('Payment system not ready. Please try again.')
      setLoading(false)
      return
    }

    const ref = `PM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const handler = pw.PaystackPop.setup({
      key: publicKey,
      email: user.email,
      amount: total * 100,
      currency: 'NGN',
      ref,
      metadata: {
        event_id: event.id,
        ticket_type_id: ticketType.id,
        quantity,
        user_id: user.id,
      },
      callback: (response: { reference: string }) => {
        setStep('processing')
        verifyPayment(response.reference)
      },
      onClose: () => {
        setLoading(false)
      },
    })
    handler.openIframe()
  }

  const handleFreeClaim = async () => {
    setLoading(true)
    setError('')
    setStep('processing')
    try {
      const res = await fetch('/api/tickets/claim-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          ticket_type_id: ticketType.id,
          quantity,
          user_id: user.id,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          attendees: buildAttendeesPayload(),
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setStep('summary')
      } else {
        setConfirmedTickets(data.tickets)
        setStep('confirmed')
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
      setStep('summary')
    }
    setLoading(false)
  }

  const handleDownloadImage = async (ticket: ConfirmedTicket) => {
    setDownloadingCode(ticket.ticket_code)
    try {
      await downloadTicketImage({
        eventTitle: event.title,
        ticketTypeName: ticketType.name,
        eventDate: event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '',
        venueName: event.venue_name,
        ticketCode: ticket.ticket_code,
        attendeeName: ticket.attendee_name,
      })
      setSavedCode(ticket.ticket_code)
      setTimeout(() => setSavedCode(null), 2000)
    } catch (err) {
      console.error('Download image failed:', err)
    }
    setDownloadingCode(null)
  }

  const handleDownloadPDF = async (ticket: ConfirmedTicket) => {
    setDownloadingCode(ticket.ticket_code)
    try {
      await downloadTicketPDF({
        eventTitle: event.title,
        ticketTypeName: ticketType.name,
        eventDate: event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '',
        venueName: event.venue_name,
        ticketCode: ticket.ticket_code,
        attendeeName: ticket.attendee_name,
      })
      setSavedCode(ticket.ticket_code)
      setTimeout(() => setSavedCode(null), 2000)
    } catch (err) {
      console.error('Download PDF failed:', err)
    }
    setDownloadingCode(null)
  }

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 transition-all"
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"

  return (
    <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={step !== 'processing' ? onClose : undefined}
      />

      <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-extrabold text-gray-900">
            {step === 'confirmed' ? 'Tickets Confirmed!' : step === 'processing' ? 'Processing...' : step === 'details' ? 'Your Details' : 'Get Tickets'}
          </h2>
          {step !== 'processing' && (
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">

          {/* Step — Select */}
          {step === 'select' && (
            <div className="p-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {event.title.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 truncate">{event.title}</div>
                  <div className="text-xs text-gray-500">
                    {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''} · {event.start_time?.slice(0, 5)}
                  </div>
                </div>
              </div>

              <div className="border-2 border-orange-200 bg-orange-50 rounded-2xl p-4 mb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-gray-900 mb-0.5">{ticketType.name}</div>
                    {ticketType.description && <div className="text-xs text-gray-500">{ticketType.description}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-gray-900">
                      {event.is_free ? 'Free' : `₦${ticketType.price.toLocaleString()}`}
                    </div>
                    {ticketType.is_group_ticket && <div className="text-xs text-gray-400">for {ticketType.group_size} people</div>}
                  </div>
                </div>
              </div>

              {!ticketType.is_group_ticket && (
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-semibold text-gray-700">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-300 transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-lg font-extrabold text-gray-900 w-6 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-9 h-9 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-300 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => setStep('details')} className="w-full py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step — Details */}
          {step === 'details' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-gray-900">Your details</span>
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <label className={labelClass}>Full name</label>
                  <input type="text" placeholder="Your full name" value={buyerName} onChange={e => setBuyerName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone number</label>
                  <input type="tel" placeholder="e.g. 080..." value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={user.email} disabled className={inputClass + ' opacity-60 cursor-not-allowed'} />
                </div>
              </div>

              {extraAttendeeCount > 0 && (
                <>
                  <div
                    onClick={() => setSendToMeOnly(!sendToMeOnly)}
                    className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all mb-4 ${sendToMeOnly ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div>
                      <div className="text-sm font-bold text-gray-900">Send all tickets to my email</div>
                      <div className="text-xs text-gray-500">All {quantity} tickets go to {user.email}</div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${sendToMeOnly ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}>
                      {sendToMeOnly && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>

                  {!sendToMeOnly && (
                    <div className="space-y-4 mb-4">
                      <p className="text-xs text-gray-500">Add details for the other {extraAttendeeCount} {extraAttendeeCount === 1 ? 'person' : 'people'}. Each will receive their own ticket by email.</p>
                      {attendees.map((attendee, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-xl space-y-2.5">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket {i + 2}</div>
                          <input
                            type="text"
                            placeholder="Full name"
                            value={attendee.name}
                            onChange={e => setAttendees(prev => prev.map((a, idx) => idx === i ? { ...a, name: e.target.value } : a))}
                            className={inputClass}
                          />
                          <input
                            type="email"
                            placeholder="Email (optional — for their own ticket)"
                            value={attendee.email}
                            onChange={e => setAttendees(prev => prev.map((a, idx) => idx === i ? { ...a, email: e.target.value } : a))}
                            className={inputClass}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {detailsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">{detailsError}</div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setStep('select')} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">
                  Back
                </button>
                <button
                  onClick={() => { if (validateDetails()) setStep('summary') }}
                  className="flex-1 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step — Summary */}
          {step === 'summary' && (
            <div className="p-6">
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{ticketType.name} × {quantity}</span>
                  <span className="font-semibold text-gray-900">
                    {event.is_free ? 'Free' : `₦${subtotal.toLocaleString()}`}
                  </span>
                </div>
                {!event.is_free && discountPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-semibold">Referral discount ({discountPercent}%)</span>
                    <span className="font-semibold text-green-600">-₦{referralDiscountAmount.toLocaleString()}</span>
                  </div>
                )}
                {!event.is_free && promoApplied && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-semibold">
                      Promo {promoApplied.code} ({promoApplied.discount_type === 'percentage' ? `${promoApplied.discount_value}%` : `₦${promoApplied.discount_value}`})
                    </span>
                    <span className="font-semibold text-green-600">-₦{promoDiscountAmount.toLocaleString()}</span>
                  </div>
                )}
                {!event.is_free && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Service fee</span>
                    <span className="font-semibold text-gray-900">₦{serviceFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between">
                  <span className="font-extrabold text-gray-900">Total</span>
                  <span className="font-extrabold text-orange-500 text-lg">
                    {event.is_free ? 'Free' : `₦${total.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {!event.is_free && discountPercent > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl mb-3 text-xs text-green-700 flex items-center gap-2">
                  <span>🎁</span>
                  You have a {discountPercent}% referral discount applied to this purchase!
                </div>
              )}

              {!event.is_free && !promoApplied && (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError('') }}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-900 outline-none focus:border-orange-400 transition-all"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {promoError && <p className="text-xs text-red-500 mt-1.5">{promoError}</p>}
                </div>
              )}

              {!event.is_free && promoApplied && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl mb-4">
                  <span className="text-xs font-bold text-green-700">🎉 Promo code {promoApplied.code} applied!</span>
                  <button onClick={() => { setPromoApplied(null); setPromoCode('') }} className="text-xs font-semibold text-green-600 hover:underline">
                    Remove
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4 break-words">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setStep('details')} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">
                  Back
                </button>
                <button
                  onClick={event.is_free ? handleFreeClaim : handlePaystack}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? 'Please wait...' : event.is_free ? 'Claim Free Ticket' : `Pay ₦${total.toLocaleString()}`}
                </button>
              </div>
            </div>
          )}

          {/* Step — Processing */}
          {step === 'processing' && (
            <div className="p-10 text-center">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-sm font-semibold text-gray-600">Confirming your {quantity > 1 ? 'tickets' : 'ticket'}...</div>
              <div className="text-xs text-gray-400 mt-2">Please do not close this window</div>
            </div>
          )}

          {/* Step — Confirmed */}
          {step === 'confirmed' && (
            <div className="p-6">
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-green-500" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                  You&apos;re <span className="text-orange-500">in!</span>
                </h3>
                <p className="text-xs text-gray-500">
                  {confirmedTickets.length > 1
                    ? `${confirmedTickets.length} tickets confirmed and emailed`
                    : 'Your ticket has been confirmed and emailed to you'}
                </p>
              </div>

              <div className="space-y-4 mb-4">
                {confirmedTickets.map((ticket, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border-2 border-gray-100">
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 truncate">{ticket.attendee_name || event.title}</div>
                        <div className="text-xs font-mono text-gray-500">{ticket.ticket_code}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        onClick={() => handleDownloadImage(ticket)}
                        disabled={downloadingCode === ticket.ticket_code}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {savedCode === ticket.ticket_code ? <><Check className="w-3.5 h-3.5" /> Saved</> : <><Download className="w-3.5 h-3.5" /> Image</>}
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(ticket)}
                        disabled={downloadingCode === ticket.ticket_code}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                      >
                        <FileText className="w-3.5 h-3.5" /> PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">
                  Close
                </button>
                <a href="/dashboard" className="flex-1 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center">
                  View in Dashboard
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}