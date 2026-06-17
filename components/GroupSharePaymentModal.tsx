'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Check, ArrowRight, Users, Plus, Minus, Ticket } from 'lucide-react'

interface Props {
  groupId: string
  groupName: string
  eventTitle: string
  amountPerMember: number
  needsPayment: boolean
  remainingSpots: number
  userEmail: string
  onClose: () => void
  onComplete: (groupCompleted: boolean) => void
}

interface PaystackWindow extends Window {
  PaystackPop: {
    setup: (config: Record<string, unknown>) => { openIframe: () => void }
  }
}

interface AttendeeInput { name: string, email: string, phone: string }

type Step = 'spots' | 'details' | 'processing' | 'done'

export default function GroupSharePaymentModal({
  groupId, groupName, eventTitle, amountPerMember, needsPayment, remainingSpots, userEmail, onClose, onComplete,
}: Props) {
  const [step, setStep] = useState<Step>('spots')
  const [spotCount, setSpotCount] = useState(1)
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [sendToMeOnly, setSendToMeOnly] = useState(true)
  const [attendees, setAttendees] = useState<AttendeeInput[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [groupCompleted, setGroupCompleted] = useState(false)
  const [resultTickets, setResultTickets] = useState<{ ticket_code: string, attendee_name?: string }[]>([])
  const paystackReady = useRef(false)

  const extraAttendeeCount = Math.max(0, spotCount - 1)
  const totalAmount = amountPerMember * spotCount

  useEffect(() => {
    setAttendees(prev => {
      const next = [...prev]
      while (next.length < extraAttendeeCount) next.push({ name: '', email: '', phone: '' })
      while (next.length > extraAttendeeCount) next.pop()
      return next
    })
  }, [extraAttendeeCount])

  useEffect(() => {
    const pw = window as unknown as PaystackWindow
    if (pw.PaystackPop) { paystackReady.current = true; return }
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

  const buildAttendeesPayload = (): AttendeeInput[] => {
    const list: AttendeeInput[] = [{ name: buyerName, email: userEmail, phone: buyerPhone }]
    if (sendToMeOnly) {
      for (let i = 0; i < extraAttendeeCount; i++) list.push({ name: buyerName, email: userEmail, phone: buyerPhone })
    } else {
      attendees.forEach(a => list.push({ name: a.name || buyerName, email: a.email || userEmail, phone: a.phone || buyerPhone }))
    }
    return list
  }

  const verifyShare = async (reference: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/pay-share/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, spots: spotCount, attendees: buildAttendeesPayload() }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setStep('details')
      } else {
        setGroupCompleted(data.group_completed)
        if (data.tickets) setResultTickets(data.tickets)
        setStep('done')
      }
    } catch {
      setError('Network error confirming payment. Please contact support.')
      setStep('details')
    }
    setLoading(false)
  }

  const validateDetails = () => {
    if (!buyerName.trim()) { setError('Please enter your full name'); return false }
    if (!buyerPhone.trim()) { setError('Please enter your phone number'); return false }
    if (!sendToMeOnly) {
      for (const a of attendees) {
        if (!a.name.trim()) { setError('Please fill in all attendee names, or choose to send all spots to your email'); return false }
      }
    }
    setError('')
    return true
  }

  const handlePay = () => {
    if (!validateDetails()) return

    if (!needsPayment) {
      setStep('processing')
      verifyShare('FREE')
      return
    }

    setLoading(true)
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!publicKey) { setError('Payment configuration error.'); setLoading(false); return }

    const pw = window as unknown as PaystackWindow
    if (!pw.PaystackPop) { setError('Payment system not ready. Please try again.'); setLoading(false); return }

    const ref = `PMGRP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const handler = pw.PaystackPop.setup({
      key: publicKey,
      email: userEmail,
      amount: totalAmount * 100,
      currency: 'NGN',
      ref,
      callback: (response: { reference: string }) => {
        setStep('processing')
        verifyShare(response.reference)
      },
      onClose: () => setLoading(false),
    })
    handler.openIframe()
  }

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 transition-all"
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"

  return (
    <div className="fixed inset-0 z-[550] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step !== 'processing' ? onClose : undefined} />

      <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-extrabold text-gray-900">
            {step === 'done' ? 'Confirmed!' : 'Secure Your Spot'}
          </h2>
          {step !== 'processing' && (
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">

          {step === 'spots' && (
            <div className="p-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 truncate">{groupName}</div>
                  <div className="text-xs text-gray-500 truncate">{eventTitle}</div>
                </div>
              </div>

              <p className="text-sm font-semibold text-gray-700 mb-2">How many spots are you paying for?</p>
              <p className="text-xs text-gray-500 mb-4">You can pay for just yourself, or cover multiple spots for friends now. {remainingSpots} spot{remainingSpots === 1 ? '' : 's'} remaining.</p>

              <div className="flex items-center justify-center gap-4 mb-5">
                <button onClick={() => setSpotCount(Math.max(1, spotCount - 1))} className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-300 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-extrabold text-gray-900 w-10 text-center">{spotCount}</span>
                <button onClick={() => setSpotCount(Math.min(remainingSpots, spotCount + 1))} className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-300 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="border-2 border-orange-200 bg-orange-50 rounded-2xl p-4 mb-5 text-center">
                <div className="text-xs text-gray-500 mb-1">Total to pay now</div>
                <div className="text-2xl font-extrabold text-gray-900">
                  {totalAmount > 0 ? `₦${totalAmount.toLocaleString()}` : 'Free'}
                </div>
                {spotCount > 1 && <div className="text-xs text-gray-400 mt-1">₦{amountPerMember.toLocaleString()} × {spotCount} spots</div>}
              </div>

              <button onClick={() => setStep('details')} className="w-full py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 'details' && (
            <div className="p-6">
              <div className="space-y-3 mb-5">
                <div>
                  <label className={labelClass}>Your full name</label>
                  <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Your full name" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Your phone number</label>
                  <input type="tel" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="e.g. 080..." className={inputClass} />
                </div>
              </div>

              {extraAttendeeCount > 0 && (
                <>
                  <div
                    onClick={() => setSendToMeOnly(!sendToMeOnly)}
                    className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all mb-4 ${sendToMeOnly ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div>
                      <div className="text-sm font-bold text-gray-900">Send all spots to my email</div>
                      <div className="text-xs text-gray-500">All {spotCount} tickets go to {userEmail}</div>
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
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Spot {i + 2}</div>
                          <input type="text" placeholder="Full name" value={attendee.name}
                            onChange={e => setAttendees(prev => prev.map((a, idx) => idx === i ? { ...a, name: e.target.value } : a))}
                            className={inputClass} />
                          <input type="email" placeholder="Email (optional — for their own ticket)" value={attendee.email}
                            onChange={e => setAttendees(prev => prev.map((a, idx) => idx === i ? { ...a, email: e.target.value } : a))}
                            className={inputClass} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">{error}</div>}

              <div className="flex gap-2">
                <button onClick={() => setStep('spots')} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">
                  Back
                </button>
                <button onClick={handlePay} disabled={loading} className="flex-1 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? 'Please wait...' : totalAmount > 0 ? `Pay ₦${totalAmount.toLocaleString()}` : 'Confirm Spots'}
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="p-10 text-center">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-sm font-semibold text-gray-600">Confirming your spot{spotCount > 1 ? 's' : ''}...</div>
            </div>
          )}

          {step === 'done' && (
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-green-500" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-1">You&apos;re secured!</h3>
              <p className="text-sm text-gray-500 mb-5">
                {groupCompleted
                  ? `The group is now full and ${resultTickets.length > 1 ? 'tickets have' : 'your ticket has'} been issued! Check your email and dashboard.`
                  : 'Your spot is confirmed. We will notify you when the group is complete and tickets are issued.'}
              </p>

              {groupCompleted && resultTickets.length > 0 && (
                <div className="space-y-2 mb-5">
                  {resultTickets.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Ticket className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <div className="text-left">
                        {t.attendee_name && <div className="text-xs font-bold text-gray-700">{t.attendee_name}</div>}
                        <div className="text-xs font-mono text-gray-500">{t.ticket_code}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => onComplete(groupCompleted)} className="w-full py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
                {groupCompleted ? 'View Tickets' : 'Done'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}