'use client'

import { useState } from 'react'
import { Star, Loader2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  eventId: string
  isFeatured: boolean
}

export default function AdminFeatureEventButton({ eventId, isFeatured }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    const endpoint = isFeatured
      ? `/api/admin/events/${eventId}/unfeature`
      : `/api/admin/events/${eventId}/feature`

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  if (isFeatured) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
        ) : (
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
        )}
        <span>Remove from Spotlight</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Star className="w-3.5 h-3.5 fill-white" />
      )}
      <span>Feature</span>
    </button>
  )
}
