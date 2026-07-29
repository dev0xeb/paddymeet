'use client'

import { useState } from 'react'
import { X, CheckCircle, Loader2 } from 'lucide-react'

interface Props {
  organiserId: string
  orgName: string
  amount: number
  ordersCount: number
  onClose: () => void
  onSuccess: () => void
}

const PAYMENT_METHODS = [
  { value: 'moniepoint', label: 'Moniepoint' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'paystack', label: 'Paystack' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
]

export default function MarkPaidModal({ organiserId, orgName, amount, ordersCount, onClose, onSuccess }: Props) {
  const [paymentMethod, setPaymentMethod] = useState('moniepoint')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!reference.trim()) {
      setError('Please enter a payment reference')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/payouts/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organiser_id: organiserId,
          amount,
          orders_count: ordersCount,
          payment_method: paymentMethod,
          payment_reference: reference,
          note,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        onSuccess()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 transition-all"
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-extrabold text-gray-900">Mark as Paid</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Summary */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
            <div className="text-sm font-bold text-gray-900 mb-1">{orgName}</div>
            <div className="text-2xl font-extrabold text-green-600">₦{amount.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">{ordersCount} order{ordersCount !== 1 ? 's' : ''}</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
                      paymentMethod === m.value
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Payment Reference *</label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="e.g. TRF/2026/001234"
                className={inputClass}
              />
              <p className="text-xs text-gray-400 mt-1">Enter the transaction ID or reference from your payment platform</p>
            </div>

            <div>
              <label className={labelClass}>Note (optional)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
                className={inputClass + ' resize-none'}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : <><CheckCircle className="w-4 h-4" /> Confirm Payment</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}