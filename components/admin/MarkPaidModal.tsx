'use client'

import { useState } from 'react'
import { X, CheckCircle, Loader2, Copy, Check, AlertTriangle, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  organiserId: string
  orgName: string
  amount: number
  ordersCount: number
  bankName?: string
  accountNumber?: string
  accountName?: string
  onClose: () => void
  onSuccess: () => void
}

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'moniepoint', label: 'Moniepoint' },
  { value: 'paystack', label: 'Paystack' },
  { value: 'cash', label: 'Cash / Direct' },
]

export default function MarkPaidModal({
  organiserId,
  orgName,
  amount,
  ordersCount,
  bankName,
  accountNumber,
  accountName,
  onClose,
  onSuccess,
}: Props) {
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const hasBankDetails = Boolean(accountNumber && accountNumber !== '—')

  const handleCopyAccount = () => {
    if (!accountNumber || accountNumber === '—') return
    navigator.clipboard.writeText(accountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    if (!reference.trim()) {
      setError('Please enter a transaction / payment reference')
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
          payment_reference: reference.trim(),
          note: note.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        router.refresh()
        onSuccess()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all shadow-sm"

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-left">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Record Organiser Payout</h2>
            <p className="text-xs text-slate-500">Confirm disbursement of ticket funds to host</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 my-4">
          {/* Summary Box */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
            <div className="text-xs font-semibold text-slate-600 mb-1">{orgName}</div>
            <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
              ₦{amount.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium">
              Net earnings from {ordersCount} ticket order{ordersCount !== 1 ? 's' : ''} (5% platform fee deducted)
            </div>
          </div>

          {/* Bank Account Verification Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Host Bank Account
              </span>
              {hasBankDetails && (
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Account</>}
                </button>
              )}
            </div>

            {hasBankDetails ? (
              <div className="space-y-0.5 text-xs text-slate-800 font-medium">
                <div><span className="text-slate-400 font-normal">Bank:</span> {bankName}</div>
                <div><span className="text-slate-400 font-normal">Account No:</span> <strong className="font-mono text-slate-900">{accountNumber}</strong></div>
                <div><span className="text-slate-400 font-normal">Name:</span> {accountName}</div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Organiser has not added their bank details yet.</span>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Payment Method Used
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    paymentMethod === m.value
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-500/20 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Reference */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Payment Reference / Transaction ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. TRF-2026-98124 or Paystack Transfer Ref"
              className={inputClass}
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Internal Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Disbursed via Moniepoint business account..."
              rows={2}
              className={inputClass + ' resize-none'}
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recording...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Disbursed</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}