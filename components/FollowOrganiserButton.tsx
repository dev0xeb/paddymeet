'use client'

import { useState, useEffect } from 'react'
import { UserPlus, UserCheck, Users } from 'lucide-react'

interface Props {
  organiserId: string
  organiserName?: string
  initialFollowing?: boolean
  initialCount?: number
  className?: string
}

export default function FollowOrganiserButton({
  organiserId,
  organiserName = 'Organiser',
  initialFollowing = false,
  initialCount = 0,
  className = '',
}: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  // Fetch live follow status on mount
  useEffect(() => {
    let isMounted = true
    fetch(`/api/organisers/${organiserId}/follow`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data && typeof data.following === 'boolean') {
          setFollowing(data.following)
          setCount(data.follower_count)
        }
      })
      .catch(() => {})

    return () => { isMounted = false }
  }, [organiserId])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return

    // Optimistic UI update
    const nextFollowing = !following
    const nextCount = nextFollowing ? count + 1 : Math.max(0, count - 1)
    setFollowing(nextFollowing)
    setCount(nextCount)
    setLoading(true)

    try {
      const res = await fetch(`/api/organisers/${organiserId}/follow`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.error) {
        // Revert on error
        setFollowing(!nextFollowing)
        setCount(count)
      } else {
        setFollowing(data.following)
        setCount(data.follower_count)
      }
    } catch {
      // Revert on error
      setFollowing(!nextFollowing)
      setCount(count)
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm ${
        following
          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
          : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 shadow-orange-500/20'
      } ${className}`}
    >
      {following ? (
        <>
          <UserCheck className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Follow</span>
        </>
      )}
      <span className="h-3 w-px bg-current opacity-20" />
      <span className="font-mono text-[11px] opacity-90">{count.toLocaleString()}</span>
    </button>
  )
}
