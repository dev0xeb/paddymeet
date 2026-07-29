'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import MarkPaidModal from './MarkPaidModal'

interface Props {
  organiserId: string
  orgName: string
  amount: number
  ordersCount: number
}

export default function PayoutActionButtons({ organiserId, orgName, amount, ordersCount }: Props) {
  const [showMarkPaid, setShowMarkPaid] = useState(false)
  const [holding, setHolding] = useState(false)
  const [held, setHeld] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')

  const handleHold = async () => {
    const reason = window.prompt('Reason for holding this payout (optional):') 
    if (reason === null) return // cancelled
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
      <span className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-xl flex items-center gap-1">
        <CheckCircle className="w-3 h-3" /> Paid
      </span>
    )
  }

  if (held) {
    return (
      <span className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl flex items-center gap-1">
        <XCircle className="w-3 h-3" /> On Hold
      </span>
    )
  }

  return (
    <>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setShowMarkPaid(true)}
          className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-xl hover:bg-green-100 transition-colors flex items-center gap-1"
        >
          <CheckCircle className="w-3 h-3" /> Mark Paid
        </button>
        <button
          onClick={handleHold}
          disabled={holding}
          className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {holding ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
          Hold
        </button>
      </div>

      {showMarkPaid && (
        <MarkPaidModal
          organiserId={organiserId}
          orgName={orgName}
          amount={amount}
          ordersCount={ordersCount}
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