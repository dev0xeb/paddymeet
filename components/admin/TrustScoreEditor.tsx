'use client'

import { useState } from 'react'
import { Check, Loader2, Plus, Minus, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { MAX_TRUST_SCORE } from '@/lib/trustScore'

interface Thresholds {
  newbie: number
  social: number
  crew: number
  elite: number
  legendary: number
}

interface Props {
  userId: string
  currentScore: number
  thresholds?: Thresholds
}

const defaultThresholds: Thresholds = {
  newbie: 0,
  social: 60,
  crew: 100,
  elite: 140,
  legendary: 180,
}

export default function TrustScoreEditor({
  userId,
  currentScore,
  thresholds = defaultThresholds,
}: Props) {
  const [score, setScore] = useState(currentScore)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const getTierInfo = (val: number) => {
    if (val >= thresholds.legendary) return { name: 'Legendary', color: 'bg-orange-50 text-orange-700 border-orange-200' }
    if (val >= thresholds.elite) return { name: 'Elite', color: 'bg-purple-50 text-purple-700 border-purple-200' }
    if (val >= thresholds.crew) return { name: 'Crew', color: 'bg-blue-50 text-blue-700 border-blue-200' }
    if (val >= thresholds.social) return { name: 'Social', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    return { name: 'Newbie', color: 'bg-slate-100 text-slate-700 border-slate-200' }
  }

  const currentTier = getTierInfo(score)

  const handleAdjust = (delta: number) => {
    const next = Math.max(0, Math.min(MAX_TRUST_SCORE, score + delta))
    setScore(next)
  }

  const handleSave = async () => {
    if (saving || score === currentScore) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/trust-score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trust_score: score }),
      })
      if (res.ok) {
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 min-w-[220px]">
      {/* Live Tier & Score Bar */}
      <div className="flex items-center justify-between gap-2">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${currentTier.color}`}>
          {currentTier.name}
        </span>
        <span className="text-xs font-mono font-bold text-slate-700">{score}/{MAX_TRUST_SCORE}</span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            score >= thresholds.legendary ? 'bg-orange-500' :
            score >= thresholds.elite ? 'bg-purple-500' :
            score >= thresholds.crew ? 'bg-blue-500' :
            score >= thresholds.social ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
          style={{ width: `${(score / MAX_TRUST_SCORE) * 100}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 mt-1">
        <button
          type="button"
          onClick={() => handleAdjust(-10)}
          title="Apply -10 Penalty"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold border border-rose-200 transition-colors"
        >
          -10
        </button>

        <input
          type="number"
          min="0"
          max={MAX_TRUST_SCORE}
          value={score}
          onChange={e => setScore(Math.max(0, Math.min(MAX_TRUST_SCORE, parseInt(e.target.value) || 0)))}
          className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 text-center outline-none focus:border-orange-500 shadow-sm"
        />

        <button
          type="button"
          onClick={() => handleAdjust(10)}
          title="Award +10 Bonus"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-colors"
        >
          +10
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || score === currentScore}
          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3 text-emerald-400" /> : 'Save'}
        </button>
      </div>
    </div>
  )
}