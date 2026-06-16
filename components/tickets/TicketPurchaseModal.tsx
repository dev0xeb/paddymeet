'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Minus, Check, ArrowRight, Ticket, Download, FileText } from 'lucide-react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

type Step = 'select' | 'summary' | 'processing' | 'confirmed'

export default function TicketPurchaseModal({ event, ticketType, user, onClose }: Props) {
  const [step, setStep] = useState<Step>('select')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmedTickets, setConfirmedTickets] = useState<{ ticket_code: string }[]>([])
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({})
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const paystackReady = useRef(false)
  const ticketRef = useRef<HTMLDivElement>(null)

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

  // Generate QR codes once tickets are confirmed
  useEffect(() => {
    if (step === 'confirmed' && confirmedTickets.length > 0) {
      confirmedTickets.forEach(ticket => {
        QRCode.toDataURL(ticket.ticket_code, {
          width: 280,
          margin: 1,
          color: { dark: '#111827', light: '#ffffff' },
        }).then(url => {
          setQrDataUrls(prev => ({ ...prev, [ticket.ticket_code]: url }))
        })
      })
    }
  }, [step, confirmedTickets])

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

  const handleDownloadImage = async () => {
    if (!ticketRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(ticketRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `paddymeet-ticket-${confirmedTickets[0]?.ticket_code}.png`
      link.click()
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2000)
    } catch (err) {
      console.error('Download image failed:', err)
    }
    setDownloading(false)
  }

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(ticketRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`paddymeet-ticket-${confirmedTickets[0]?.ticket_code}.pdf`)
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2000)
    } catch {
      // silent fail
    }
    setDownloading(false)
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

  return (
    <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={step !== 'processing' ? onClose : undefined}
      />

      <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-extrabold text-gray-900">
            {step === 'confirmed' ? 'Ticket Confirmed!' : step === 'processing' ? 'Processing...' : 'Get Tickets'}
          </h2>
          {step !== 'processing' && (
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

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

            <button onClick={() => setStep('summary')} className="w-full py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
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
              <button onClick={() => setStep('select')} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">
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
            <div className="text-sm font-semibold text-gray-600">Confirming your ticket...</div>
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
              <p className="text-xs text-gray-500">Your ticket has been confirmed and emailed to you</p>
            </div>

            {/* Downloadable ticket card */}
            {confirmedTickets.length > 0 && (
              <div ref={ticketRef} className="bg-white rounded-2xl overflow-hidden border-2 border-gray-100 mb-4">
                <div className="bg-gradient-to-br from-orange-500 to-pink-500 px-5 py-4 text-center">
                  <div className="text-base font-extrabold text-white tracking-tight">
                    paddy<span className="text-gray-900">meet</span>
                  </div>
                </div>
                <div className="p-5 text-center">
                  <div className="text-sm font-extrabold text-gray-900 mb-1">{event.title}</div>
                  <div className="text-xs text-gray-500 mb-4">
                    {ticketType.name} · {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}{event.venue_name ? ` · ${event.venue_name}` : ''}
                  </div>

                  <div className="bg-white border-2 border-gray-100 rounded-2xl p-3 inline-block mb-3">
                    {qrDataUrls[confirmedTickets[0].ticket_code] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrDataUrls[confirmedTickets[0].ticket_code]} alt="Ticket QR Code" className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="text-xs font-mono font-extrabold text-gray-700 tracking-widest">{confirmedTickets[0].ticket_code}</div>

                  {confirmedTickets.length > 1 && (
                    <div className="mt-3 space-y-1.5">
                      {confirmedTickets.slice(1).map((ticket, i) => (
                        <div key={i} className="flex items-center justify-center gap-2 text-xs text-gray-500">
                          <Ticket className="w-3 h-3" /> {ticket.ticket_code}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-dashed border-gray-200 px-5 py-3 text-center">
                  <p className="text-xs text-gray-400">Present this QR code at entry</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <button
                onClick={handleDownloadImage}
                disabled={downloading || Object.keys(qrDataUrls).length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {downloaded ? <><Check className="w-3.5 h-3.5" /> Saved</> : <><Download className="w-3.5 h-3.5" /> Save Image</>}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading || Object.keys(qrDataUrls).length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" /> Save PDF
              </button>
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
  )
}