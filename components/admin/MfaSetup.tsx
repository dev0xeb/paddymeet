'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ShieldCheck, Loader2, Check, AlertCircle, Smartphone, Trash2, KeyRound } from 'lucide-react'

export default function MfaSetup() {
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [factorId, setFactorId] = useState('')

  const [enrolling, setEnrolling] = useState(false)
  const [pendingFactorId, setPendingFactorId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadFactors = async () => {
    const supabase = createClient()
    const { data, error: listError } = await supabase.auth.mfa.listFactors()
    if (!listError && data) {
      const verified = data.totp.find(f => f.status === 'verified')
      setEnrolled(!!verified)
      setFactorId(verified?.id || '')
    }
    setLoading(false)
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.mfa.listFactors().then(({ data, error: listError }) => {
      if (!listError && data) {
        const verified = data.totp.find(f => f.status === 'verified')
        setEnrolled(!!verified)
        setFactorId(verified?.id || '')
      }
      setLoading(false)
    })
  }, [])

  const startEnroll = async () => {
    setError('')
    setEnrolling(true)
    const supabase = createClient()
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (enrollError || !data) {
      setError(enrollError?.message || 'Could not start enrollment. Please try again.')
      setEnrolling(false)
      return
    }
    setPendingFactorId(data.id)
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
  }

  const cancelEnroll = async () => {
    // Clean up the unverified factor so it doesn't linger and block a retry
    // (Supabase only allows one in-progress TOTP enrollment at a time).
    if (pendingFactorId) {
      const supabase = createClient()
      await supabase.auth.mfa.unenroll({ factorId: pendingFactorId })
    }
    setEnrolling(false)
    setPendingFactorId('')
    setQrCode('')
    setSecret('')
    setCode('')
    setError('')
  }

  const confirmEnroll = async () => {
    if (code.trim().length < 6) { setError('Enter the 6-digit code from your authenticator app.'); return }
    setVerifying(true)
    setError('')
    const supabase = createClient()

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: pendingFactorId })
    if (challengeError || !challenge) {
      setError('Could not verify right now. Please try again.')
      setVerifying(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: pendingFactorId,
      challengeId: challenge.id,
      code: code.trim(),
    })

    if (verifyError) {
      setError('That code is invalid or expired. Check your authenticator app and try again.')
      setCode('')
      setVerifying(false)
      return
    }

    setEnrolling(false)
    setPendingFactorId('')
    setQrCode('')
    setSecret('')
    setCode('')
    setVerifying(false)
    setSuccess('Two-factor authentication is now active on your account.')
    setTimeout(() => setSuccess(''), 5000)
    await loadFactors()
  }

  const removeFactor = async () => {
    if (!confirm('Remove two-factor authentication from your account? You will only need your password to sign in afterward.')) return
    setRemoving(true)
    setError('')
    const supabase = createClient()
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId })
    if (unenrollError) {
      setError('Could not remove two-factor authentication. Please try again.')
      setRemoving(false)
      return
    }
    setEnrolled(false)
    setFactorId('')
    setRemoving(false)
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Two-Factor Authentication</h2>
          <p className="text-[11px] text-slate-400">Secures your own admin account with an authenticator app code at every login</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
          Checking your security status...
        </div>
      ) : enrolling ? (
        <div className="space-y-4">
          {qrCode ? (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase returns a data: URI SVG, not an optimizable remote image */}
                <img src={qrCode} alt="Scan with your authenticator app" className="w-36 h-36 bg-white rounded-lg border border-slate-200 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 mb-1.5">1. Scan this QR code</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">
                    Using Google Authenticator, Authy, 1Password, or any TOTP app. Can&apos;t scan it?
                  </p>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Manual entry key</div>
                  <code className="block px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 break-all">{secret}</code>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  2. Enter the 6-digit code it shows
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && confirmEnroll()}
                  className="w-full max-w-[180px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-orange-500 transition-all tracking-[0.3em] font-mono text-center"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={confirmEnroll}
                  disabled={verifying || code.length < 6}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Confirm & Enable'}
                </button>
                <button
                  type="button"
                  onClick={cancelEnroll}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
              Generating your QR code...
            </div>
          )}
        </div>
      ) : enrolled ? (
        <div className="flex items-center justify-between gap-4 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-800">Enabled</div>
              <div className="text-[11px] text-emerald-700/80">An authenticator code is required every time you sign in</div>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFactor}
            disabled={removing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> {removing ? 'Removing...' : 'Disable'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700">Not set up</div>
              <div className="text-[11px] text-slate-500">Your account currently signs in with just a password</div>
            </div>
          </div>
          <button
            type="button"
            onClick={startEnroll}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex-shrink-0"
          >
            Set Up
          </button>
        </div>
      )}

      {!enrolling && error && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
