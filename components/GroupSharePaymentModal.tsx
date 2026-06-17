'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Check, ArrowRight, Users } from 'lucide-react'

interface Props {
  groupId: string
  groupName: string
  eventTitle: string
  amountPerMember: number
  needsPayment: boolean
  userEmail: string
  onClose: () => void
  onComplete: (groupCompleted: boolean) => void
}

interface PaystackWindow extends Window {
  PaystackPop: {
    setup: (config: Record<string, unknown>) => { openIframe: () => void }
  }
}

type Step = 'details' | 'pay' | 'processing' | 'done'

export default function GroupSharePaymentModal({
  groupId, groupName, eventTitle, amountPerMember, needsPayment, userEmail, onClose, onComplete,
}: Props) {
  const [step, setStep] = useState<Step>('details')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [groupCompleted, setGroupCompleted] = useState(false)
  const paystackReady = useRef(false)

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

  const verifyShare = async (reference: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/pay-share/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, attendee_name: name, attendee_phone: phone }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setStep('pay')
      } else {
        setGroupCompleted(data.group_completed)
        setStep('done')
      }
    } catch {
      setError('Network error confirming payment. Please contact support.')
      setStep('pay')
    }
    setLoading(false)
  }

  const handlePay = () => {
    if (!name.trim() || !phone.trim()) {
      setError('Please enter your name and phone number')
      return
    }
    setError('')

    if (!needsPayment) {
      // Free group share — just confirm directly without Paystack
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
      amount: amountPerMember * 100,
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

  return (
    <div className="fixed inset-0 z-[550] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step !== 'processing' ? onClose : undefined} />

      <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-extrabold text-gray-900">
            {step === 'done' ? 'Payment Confirmed' : 'Pay Your Share'}
          </h2>
          {step !== 'processing' && (
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {(step === 'details' || step === 'pay') && (
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

            <div className="border-2 border-orange-200 bg-orange-50 rounded-2xl p-4 mb-5 text-center">
              <div className="text-xs text-gray-500 mb-1">Your share</div>
              <div className="text-2xl font-extrabold text-gray-900">
                {amountPerMember > 0 ? `₦${amountPerMember.toLocaleString()}` : 'Free'}
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 080..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 transition-all" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">{error}</div>
            )}

            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? 'Please wait...' : amountPerMember > 0 ? `Pay ₦${amountPerMember.toLocaleString()}` : 'Confirm Spot'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-10 text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-sm font-semibold text-gray-600">Confirming your spot...</div>
          </div>
        )}

        {step === 'done' && (
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-green-500" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">You&apos;re secured!</h3>
            <p className="text-sm text-gray-500 mb-6">
              {groupCompleted
                ? 'The group is now full and your ticket has been issued! Check your email and dashboard.'
                : 'Your spot in the group is confirmed. We will notify you when the group is complete and your ticket is issued.'}
            </p>
            <button
              onClick={() => onComplete(groupCompleted)}
              className="w-full py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
            >
              {groupCompleted ? 'View Ticket' : 'Done'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}