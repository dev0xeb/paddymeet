'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, CameraOff, Check, X, AlertCircle, QrCode, RefreshCw, Keyboard } from 'lucide-react'

interface Event {
  id: string
  title: string
  event_date: string
  venue_name: string
}

interface ScanResult {
  valid: boolean
  status: 'valid' | 'used' | 'invalid' | 'cancelled' | 'wrong_event'
  reason?: string
  attendee_name?: string
  ticket_type?: string
  event_title?: string
  ticket_code?: string
  marked_used_at?: string
}

interface Props {
  events: Event[]
}

export default function QRScanner({ events }: Props) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '')
  const [scanning, setScanning] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setScanning(false)
  }

  const startCamera = async () => {
    setCameraError('')
    setResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScanning(true)
      startQRDetection()
    } catch {
      setCameraError('Camera access denied. Please allow camera access or use manual entry.')
    }
  }

  const startQRDetection = () => {
    // Use BarcodeDetector API if available (Chrome/Edge on Android)
    const BarcodeDetector = (window as unknown as Record<string, unknown>).BarcodeDetector as {
      new (config: { formats: string[] }): {
        detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>
      }
    } | undefined

    if (BarcodeDetector) {
      const detector = new BarcodeDetector({ formats: ['qr_code'] })
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState !== 4) return
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length > 0) {
            const code = codes[0].rawValue
            stopCamera()
            await processTicketCode(code)
          }
        } catch {
          // BarcodeDetector not ready yet
        }
      }, 300)
    } else {
      // Fallback: canvas-based scan hint (manual entry fallback)
      setCameraError('QR scanning not supported on this browser. Please use manual entry or try Chrome on Android.')
      stopCamera()
    }
  }

  const processTicketCode = async (code: string) => {
    if (!code.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/organiser/scan-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_code: code.trim().toUpperCase(),
          event_id: selectedEventId || undefined,
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ valid: false, status: 'invalid', reason: 'Network error. Please try again.' })
    }
    setLoading(false)
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    await processTicketCode(manualCode)
    setManualCode('')
  }

  const handleReset = () => {
    setResult(null)
    setManualCode('')
  }

  useEffect(() => {
    return () => { stopCamera() }
  }, [])

  const resultConfig = {
    valid: { bg: 'bg-green-50 border-green-200', icon: Check, iconBg: 'bg-green-500', text: 'text-green-700', label: '✓ Valid Ticket' },
    used: { bg: 'bg-orange-50 border-orange-200', icon: AlertCircle, iconBg: 'bg-orange-500', text: 'text-orange-700', label: '⚠ Already Used' },
    invalid: { bg: 'bg-red-50 border-red-200', icon: X, iconBg: 'bg-red-500', text: 'text-red-700', label: '✗ Invalid Ticket' },
    cancelled: { bg: 'bg-red-50 border-red-200', icon: X, iconBg: 'bg-red-500', text: 'text-red-700', label: '✗ Cancelled' },
    wrong_event: { bg: 'bg-yellow-50 border-yellow-200', icon: AlertCircle, iconBg: 'bg-yellow-500', text: 'text-yellow-700', label: '⚠ Wrong Event' },
  }

  return (
    <div className="space-y-5">
      {/* Event selector */}
      {events.length > 1 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Scanning for event</label>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-orange-400 transition-all"
          >
            <option value="">All my events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.title} — {event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC'}
              </option>
            ))}
          </select>
        </div>
      )}

      {events.length === 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-sm text-orange-700">
          You have no live events. Approve and publish an event first before scanning tickets.
        </div>
      )}

      {/* Scanner */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Camera view */}
        {scanning && (
          <div className="relative aspect-video bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {/* Scan frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-white rounded-2xl opacity-70" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-400 rounded-br-xl" />
              </div>
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="text-white text-xs bg-black/50 px-3 py-1 rounded-full">Point camera at QR code</span>
            </div>
            <button
              onClick={stopCamera}
              className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-5">
          {/* Scan result */}
          {result && (
            <div className={`border-2 rounded-2xl p-5 mb-5 ${resultConfig[result.status].bg}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${resultConfig[result.status].iconBg} flex items-center justify-center flex-shrink-0`}>
                  {result.status === 'valid'
                    ? <Check className="w-5 h-5 text-white" />
                    : result.status === 'used' || result.status === 'wrong_event'
                    ? <AlertCircle className="w-5 h-5 text-white" />
                    : <X className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <div className={`text-base font-extrabold ${resultConfig[result.status].text}`}>
                    {resultConfig[result.status].label}
                  </div>
                  {result.reason && result.status !== 'valid' && (
                    <div className={`text-xs ${resultConfig[result.status].text} opacity-80`}>{result.reason}</div>
                  )}
                </div>
              </div>

              {(result.attendee_name || result.ticket_type || result.event_title) && (
                <div className="space-y-1.5 mt-3 pt-3 border-t border-black/10">
                  {result.attendee_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Attendee</span>
                      <span className="font-bold text-gray-900">{result.attendee_name}</span>
                    </div>
                  )}
                  {result.ticket_type && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Ticket type</span>
                      <span className="font-bold text-gray-900">{result.ticket_type}</span>
                    </div>
                  )}
                  {result.event_title && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Event</span>
                      <span className="font-bold text-gray-900">{result.event_title}</span>
                    </div>
                  )}
                  {result.status === 'used' && result.marked_used_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Checked in at</span>
                      <span className="font-bold text-gray-900">
                        {new Date(result.marked_used_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8 mb-4">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Camera error */}
          {cameraError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 mb-4">
              {cameraError}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {!scanning && !loading && (
              <button
                onClick={startCamera}
                disabled={events.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40"
              >
                <Camera className="w-4 h-4" /> Scan QR Code
              </button>
            )}

            {result && (
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Scan Next Ticket
              </button>
            )}

            {/* Manual entry toggle */}
            <button
              onClick={() => setManualMode(!manualMode)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors"
            >
              <Keyboard className="w-4 h-4" />
              {manualMode ? 'Hide manual entry' : 'Enter code manually'}
            </button>

            {manualMode && (
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PM-1234567-ABCDE"
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-900 outline-none focus:border-orange-400 transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim() || loading}
                  className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  Check
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-3">How it works</h3>
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-500 font-bold flex items-center justify-center flex-shrink-0 text-xs">1</span>
            Select the event you are checking in for
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-500 font-bold flex items-center justify-center flex-shrink-0 text-xs">2</span>
            Tap Scan QR Code and point at the attendee ticket
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-500 font-bold flex items-center justify-center flex-shrink-0 text-xs">3</span>
            Green means valid — tap Scan Next Ticket to continue
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-500 font-bold flex items-center justify-center flex-shrink-0 text-xs">4</span>
            Orange means already used — do not allow entry
          </div>
        </div>
      </div>
    </div>
  )
}