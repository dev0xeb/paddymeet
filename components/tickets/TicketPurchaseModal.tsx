'use client'

import { useState } from 'react'
import { X, Plus, Minus, Check, ArrowRight, Ticket } from 'lucide-react'

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
}

interface Props {
  event: Event
  ticketType: TicketType
  user: User
  onClose: () => void
}

interface PaystackHandler {
  openIframe: () => void
}

interface PaystackConfig {
  key: string
  email: string
  amount: number
  currency: string
  ref: string
  metadata: Record<string, unknown>
  onSuccess: (transaction: { reference: string }) => void
  onCancel: () => void
}

interface PaystackWindow extends Window {
  PaystackPop: {
    setup: (config: PaystackConfig) => PaystackHandler
  }
}

type Step = 'select' | 'summary' | 'processing' | 'confirmed'

export default function TicketPurchaseModal({ event, ticketType, user, onClose }: Props) {
  const [step, setStep] = useState<Step>('select')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmedTickets, setConfirmedTickets] = useState<{ ticket_code: string }[]>([])

  const serviceFee = Math.round(ticketType.price * quantity * 0.05)
  const total = ticketType.price * quantity + serviceFee

  const verifyPayment = async (reference: string) => {
    setStep('processing')
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
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(`Payment confirmed but ticket creation failed: ${data.error}`)
        setStep('summary')
      } else if (!data.tickets) {
        setError(`Unexpected response: ${JSON.stringify(data)}`)
        setStep('summary')
      } else {
        setConfirmedTickets(data.tickets)
        setStep('confirmed')
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setStep('summary')
    }
    setLoading(false)
  }

  const handlePaystack = () => {
    setLoading(true)
    setError('')

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

    if (!publicKey) {
      setError('Payment configuration error. Please try again.')
      setLoading(false)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => {
      const paystackWindow = window as unknown as PaystackWindow
      const handler = paystackWindow.PaystackPop.setup({
        key: publicKey,
        email: user.email,
        amount: total * 100,
        currency: 'NGN',
        ref: `PM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        metadata: {
          event_id: event.id,
          ticket_type_id: ticketType.id,
          quantity,
          user_id: user.id,
        },
        onSuccess: (transaction: { reference: string }) => {
          verifyPayment(transaction.reference)
        },
        onCancel: () => {
          setLoading(false)
        },
      })
      handler.openIframe()
    }
    document.head.appendChild(script)
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
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setStep('summary')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-extrabold text-gray-900">
            {step === 'confirmed' ? 'Ticket Confirmed!' : step === 'processing' ? 'Processing...' : 'Get Tickets'}
          </h2>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
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
                  {event.event_date
                    ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    : ''}{' '}
                  · {event.start_time?.slice(0, 5)}
                </div>
              </div>
            </div>

            <div className="border-2 border-orange-200 bg-orange-50 rounded-2xl p-4 mb-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-extrabold text-gray-900 mb-0.5">{ticketType.name}</div>
                  {ticketType.description && (
                    <div className="text-xs text-gray-500">{ticketType.description}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-gray-900">
                    {event.is_free ? 'Free' : `₦${ticketType.price.toLocaleString()}`}
                  </div>
                  {ticketType.is_group_ticket && (
                    <div className="text-xs text-gray-400">for {ticketType.group_size} people</div>
                  )}
                </div>
              </div>
            </div>

            {!ticketType.is_group_ticket && (
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-semibold text-gray-700">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-300 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-lg font-extrabold text-gray-900 w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="w-9 h-9 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep('summary')}
              className="w-full py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
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
                  {event.is_free ? 'Free' : `₦${(ticketType.price * quantity).toLocaleString()}`}
                </span>
              </div>
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

            <div className="p-3 bg-gray-50 rounded-xl mb-5 text-xs text-gray-500 flex items-center gap-2">
              <span>🔒</span>
              {event.is_free
                ? 'Your free ticket will be confirmed instantly.'
                : 'Payments are processed securely by Paystack. Paddymeet never stores your card details.'}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4 break-words">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors"
              >
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
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
              You&apos;re <span className="text-orange-500">in!</span>
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Your ticket has been confirmed. See you at the event!
            </p>

            <div className="space-y-2 mb-5">
              {confirmedTickets.map((ticket, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Ticket className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span className="text-xs font-mono font-bold text-gray-700">{ticket.ticket_code}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors"
              >
                Close
              </button>
              <a
                href="/dashboard"
                className="flex-1 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center"
              >
                View in Dashboard
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}