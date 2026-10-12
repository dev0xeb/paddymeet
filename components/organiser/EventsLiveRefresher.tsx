'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

/**
 * Renders nothing — just keeps the organiser's events list (status badges,
 * the "Awaiting Paddymeet review" banner, the stat counts) in sync with
 * admin moderation actions without a manual reload. This page is server-
 * rendered, so a Postgres change on `events` (an admin approving/rejecting
 * it) wouldn't otherwise show up here until the organiser next navigated.
 * router.refresh() re-runs the server component's data fetch in place.
 */
export default function EventsLiveRefresher({ organiserId }: { organiserId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`organiser_events_${organiserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `organiser_id=eq.${organiserId}` },
        () => router.refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organiserId, router])

  return null
}
