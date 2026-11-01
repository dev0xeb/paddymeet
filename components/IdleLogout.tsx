'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const IDLE_LIMIT_MS = 10 * 60 * 1000
const ABSOLUTE_SESSION_LIMIT_MS = 6 * 60 * 60 * 1000
const ABSOLUTE_CHECK_INTERVAL_MS = 60 * 1000
const LOGIN_AT_KEY = 'pm_session_login_at'
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const

// Mounted once at the root so it covers explorer, organiser, and admin
// sessions alike — it only arms the timers while onAuthStateChange reports
// an actual session, so a logged-out visitor is never affected.
export default function IdleLogout() {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const absoluteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const loggedInRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    const forceLogout = async () => {
      await supabase.auth.signOut()
      try { localStorage.removeItem(LOGIN_AT_KEY) } catch {}
      // Full navigation (not router.push) so any in-memory session state is
      // actually cleared, not just the route changed — the point of this
      // feature is to end the session, not just change the page.
      const isAdminArea = window.location.pathname.startsWith('/admin')
      window.location.href = isAdminArea ? '/admin-login' : '/login'
    }

    const clearIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }

    const scheduleIdleLogout = () => {
      clearIdleTimer()
      if (!loggedInRef.current) return
      idleTimerRef.current = setTimeout(forceLogout, IDLE_LIMIT_MS)
    }

    // Real user activity is the only thing allowed to push the idle timer
    // back out — anything else (including the background token refresh
    // below) must never extend it, or "idle" stops meaning idle.
    const resetIdleTimer = () => {
      if (loggedInRef.current) scheduleIdleLogout()
    }

    const clearAbsoluteCheck = () => {
      if (absoluteIntervalRef.current) clearInterval(absoluteIntervalRef.current)
      absoluteIntervalRef.current = null
    }

    const checkAbsoluteTimeout = () => {
      if (!loggedInRef.current) return
      let loginAt: number | null = null
      try {
        const stored = localStorage.getItem(LOGIN_AT_KEY)
        loginAt = stored ? parseInt(stored, 10) : null
      } catch {}
      if (!loginAt) return
      if (Date.now() - loginAt >= ABSOLUTE_SESSION_LIMIT_MS) {
        clearAbsoluteCheck()
        forceLogout()
      }
    }

    const startAbsoluteCheck = () => {
      try {
        if (!localStorage.getItem(LOGIN_AT_KEY)) {
          localStorage.setItem(LOGIN_AT_KEY, String(Date.now()))
        }
      } catch {}
      clearAbsoluteCheck()
      absoluteIntervalRef.current = setInterval(checkAbsoluteTimeout, ABSOLUTE_CHECK_INTERVAL_MS)
      checkAbsoluteTimeout()
    }

    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, resetIdleTimer, { passive: true }))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      loggedInRef.current = !!session
      if (event === 'SIGNED_OUT') {
        clearIdleTimer()
        clearAbsoluteCheck()
        try { localStorage.removeItem(LOGIN_AT_KEY) } catch {}
      } else if (event === 'SIGNED_IN') {
        // A genuine fresh login — this is the one event allowed to (re)start
        // both timers. TOKEN_REFRESHED and other events fire on Supabase's
        // own background schedule regardless of whether the person is
        // actually at the keyboard, so they must not touch either timer.
        try { localStorage.setItem(LOGIN_AT_KEY, String(Date.now())) } catch {}
        scheduleIdleLogout()
        startAbsoluteCheck()
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      loggedInRef.current = !!session
      if (session) {
        scheduleIdleLogout()
        startAbsoluteCheck()
      }
    })

    return () => {
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, resetIdleTimer))
      subscription.unsubscribe()
      clearIdleTimer()
      clearAbsoluteCheck()
    }
  }, [])

  return null
}
