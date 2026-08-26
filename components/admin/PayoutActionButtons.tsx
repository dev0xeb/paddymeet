'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, DollarSign } from 'lucide-react'
import MarkPaidModal from './MarkPaidModal'

interface Props {
  organiserId: string
  orgName: string
  amount: number
  ordersCount: number
  bankName?: string
  accountNumber?: string
  accountName?: string
}

export default function PayoutActionButtons({
  organiserId,
  orgName,
  amount,
  ordersCount,
  bankName,
  accountNumber,
  accountName,
}: Props) {
  const [showMarkPaid, setShowMarkPaid] = useState(false)
  const [holding, setHolding] = useState(false)
  const [held, setHeld] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')

  const handleHold = async () => {
    const reason = window.prompt('Reason for holding this payout (optional):')
    if (reason === null) return
    setHolding(true)
    setError('')
    try {
      const res = await fetch('/api/admin/payouts/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organiser_id: organiserId,
          amount,
          orders_count: ordersCount,
          note: reason,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setHeld(true)
      }
    } catch {
      setError('Something went wrong.')
    }
    setHolding(false)
  }

  if (paid) {
    return (
      <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs">
        <CheckCircle className="w-3.5 h-3.5" /> Disbursed
      </span>
    )
  }

  if (held) {
    return (
      <span className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs">
        <XCircle className="w-3.5 h-3.5" /> On Hold
      </span>
    )
  }

  return (
    <>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setShowMarkPaid(true)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
        </button>
        <button
          type="button"
          onClick={handleHold}
          disabled={holding}
          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {holding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
          Hold
        </button>
      </div>

      {showMarkPaid && (
        <MarkPaidModal
          organiserId={organiserId}
          orgName={orgName}
          amount={amount}
          ordersCount={ordersCount}
          bankName={bankName}
          accountNumber={accountNumber}
          accountName={accountName}
          onClose={() => setShowMarkPaid(false)}
          onSuccess={() => {
            setShowMarkPaid(false)
            setPaid(true)
          }}
        />
      )}
    </>
  )
}