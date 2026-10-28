'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const IDLE_LIMIT_MS = 10 * 60 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const

// Mounted once at the root so it covers explorer, organiser, and admin
// sessions alike — it only arms the timer while onAuthStateChange reports
// an actual session, so a logged-out visitor is never affected.
export default function IdleLogout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loggedInRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    const clearTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const scheduleLogout = () => {
      clearTimer()
      if (!loggedInRef.current) return
      timerRef.current = setTimeout(async () => {
        await supabase.auth.signOut()
        // Full navigation (not router.push) so any in-memory session state
        // is actually cleared, not just the route changed — the point of
        // this feature is to end the session, not just change the page.
        const isAdminArea = window.location.pathname.startsWith('/admin')
        window.location.href = isAdminArea ? '/admin-login' : '/login'
      }, IDLE_LIMIT_MS)
    }

    const resetTimer = () => {
      if (loggedInRef.current) scheduleLogout()
    }

    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, resetTimer, { passive: true }))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loggedInRef.current = !!session
      if (session) scheduleLogout()
      else clearTimer()
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      loggedInRef.current = !!session
      if (session) scheduleLogout()
    })

    return () => {
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, resetTimer))
      subscription.unsubscribe()
      clearTimer()
    }
  }, [])

  return null
}
