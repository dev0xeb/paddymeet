'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

export default function TrustScoreEditor({ userId, currentScore }: { userId: string, currentScore: number }) {
  const [score, setScore] = useState(currentScore)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/trust-score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trust_score: score }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      // silent fail
    }
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        max="100"
        value={score}
        onChange={e => setScore(parseInt(e.target.value) || 0)}
        className="w-16 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 outline-none focus:border-orange-400 transition-all"
      />
      <button
        onClick={handleSave}
        disabled={saving || score === currentScore}
        className="px-2.5 py-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-40 flex items-center gap-1"
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : 'Save'}
      </button>
    </div>
  )
}