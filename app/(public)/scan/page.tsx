'use client'

import { useState, useRef, useEffect } from 'react'
import { Shield, Camera, CheckCircle2, XCircle, AlertTriangle, ArrowRight, RefreshCw, LogOut, Users, QrCode } from 'lucide-react'

interface EventInfo {
  id: string
  title: string
  event_date: string
  start_time: string
  venue_name: string
  city: string
}

interface Stats {
  total: number
  checked_in: number
  remaining: number
}

interface ScanResult {
  valid: boolean
  status: 'valid' | 'already_used' | 'refunded' | 'cancelled' | 'not_found' | 'wrong_event'
  reason?: string
  ticket_code?: string
  attendee_name?: string
  ticket_type?: string
  scanned_at?: string
  checked_in_at?: string
}

export default function StaffScannerPage() {
  const [passkey, setPasskey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [stats, setStats] = useState<Stats>({ total: 0, checked_in: 0, remaining: 0 })

  // Scanner state
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const handleLogin = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    if (!passkey.trim()) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/scanner/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkey.trim() }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setEvent(data.event)
        setStats(data.stats)
      }
    } catch {
      setError('Network error connecting to verification server.')
    }
    setLoading(false)
  }

  const handleScanCode = async (code: string) => {
    if (!code.trim() || !event || scanning) return
    setScanning(true)

    try {
      const res = await fetch('/api/scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_code: code.trim(), event_id: event.id }),
      })
      const data = await res.json()

      setLastResult(data)
      if (data.valid) {
        setStats(prev => ({
          ...prev,
          checked_in: prev.checked_in + 1,
          remaining: Math.max(0, prev.remaining - 1),
        }))
        // Play success beep if supported
        try {
          const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
          const osc = ctx.createOscillator()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(880, ctx.currentTime)
          osc.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.15)
        } catch {}
      }
    } catch {
      setLastResult({ valid: false, status: 'not_found', reason: 'Network connection error' })
    }
    setManualCode('')
    setScanning(false)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      console.warn('Camera access denied or unavailable')
    }
  }

  useEffect(() => {
    if (event) {
      startCamera()
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [event])

  const handleLogout = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    setEvent(null)
    setPasskey('')
    setLastResult(null)
  }

  // 1. Passkey Login View
  if (!event) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-7 h-7 text-orange-500" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">PaddyMeet Gate Scanner</h1>
            <p className="text-xs text-gray-400 mt-1">Staff Check-in & Ticket Validation Portal</p>
          </div>

          <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Event Passkey
              </label>
              <input
                type="text"
                placeholder="Enter event passkey or ID"
                value={passkey}
                onChange={e => setPasskey(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm font-mono text-white outline-none focus:border-orange-500 transition-all placeholder:text-gray-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passkey.trim()}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : <>Unlock Scanner <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Restricted to authorized event gate staff. No financial data accessible.
          </p>
        </div>
      </div>
    )
  }

  // 2. Active Scanner Portal
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top Header */}
      <header className="px-4 py-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-white truncate">{event.title}</h2>
          <p className="text-xs text-gray-400 truncate">{event.venue_name} · {event.city}</p>
        </div>
        <button
          onClick={handleLogout}
          className="ml-3 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" /> Exit
        </button>
      </header>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-gray-900/50 border-b border-gray-800">
        <div className="bg-gray-800/80 rounded-xl p-2.5 text-center">
          <div className="text-xs text-gray-400">Checked In</div>
          <div className="text-lg font-extrabold text-green-400">{stats.checked_in}</div>
        </div>
        <div className="bg-gray-800/80 rounded-xl p-2.5 text-center">
          <div className="text-xs text-gray-400">Remaining</div>
          <div className="text-lg font-extrabold text-orange-400">{stats.remaining}</div>
        </div>
        <div className="bg-gray-800/80 rounded-xl p-2.5 text-center">
          <div className="text-xs text-gray-400">Total</div>
          <div className="text-lg font-extrabold text-white">{stats.total}</div>
        </div>
      </div>

      {/* Main Viewfinder / Result Area */}
      <main className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full">
        {lastResult ? (
          <div className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center my-auto transition-all ${
            lastResult.valid
              ? 'bg-green-950/40 border-green-500 text-green-300'
              : 'bg-red-950/40 border-red-500 text-red-300'
          }`}>
            {lastResult.valid ? (
              <CheckCircle2 className="w-16 h-16 text-green-400 mb-3 animate-bounce" />
            ) : (
              <XCircle className="w-16 h-16 text-red-400 mb-3 animate-pulse" />
            )}

            <h3 className="text-xl font-extrabold mb-1">
              {lastResult.valid ? 'TICKET VALID' : lastResult.reason || 'ENTRY DENIED'}
            </h3>

            {lastResult.attendee_name && (
              <div className="text-lg font-bold text-white mt-2">
                {lastResult.attendee_name}
              </div>
            )}

            {lastResult.ticket_type && (
              <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold mt-2 uppercase tracking-wide">
                {lastResult.ticket_type}
              </div>
            )}

            {lastResult.scanned_at && (
              <p className="text-xs text-red-300/80 mt-2">
                Already checked in at {new Date(lastResult.scanned_at).toLocaleTimeString()}
              </p>
            )}

            <button
              onClick={() => setLastResult(null)}
              className="mt-6 w-full py-3 bg-white text-gray-900 font-extrabold text-sm rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Ready for Next Guest
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center space-y-4">
            {/* Viewfinder Preview */}
            <div className="relative aspect-square w-full bg-black rounded-3xl overflow-hidden border-2 border-dashed border-gray-700 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative z-10 w-48 h-48 border-2 border-orange-500/80 rounded-2xl animate-pulse pointer-events-none flex items-center justify-center">
                <QrCode className="w-12 h-12 text-orange-500/40" />
              </div>
            </div>

            {/* Manual Code Input Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleScanCode(manualCode) }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Scan or type ticket code (PM-...)"
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm font-mono text-white outline-none focus:border-orange-500 transition-all placeholder:text-gray-500"
              />
              <button
                type="submit"
                disabled={scanning || !manualCode.trim()}
                className="px-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all"
              >
                {scanning ? '...' : 'Verify'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
