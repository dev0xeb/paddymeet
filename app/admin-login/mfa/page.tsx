'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Logo from '@/components/brand/Logo'
import { Shield, Loader2, AlertCircle } from 'lucide-react'

export default function AdminMfaChallengePage() {
  const router = useRouter()
  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [code, setCode] = useState('')
  const [preparing, setPreparing] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const prepare = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/admin-login'); return }

      // If this account has no verified factor, or the session is already
      // aal2 (e.g. a reload after already passing this screen), there's
      // nothing to challenge — don't strand them here.
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (!aal || aal.nextLevel !== 'aal2' || aal.currentLevel === 'aal2') {
        router.replace('/admin/dashboard')
        return
      }

      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp.find(f => f.status === 'verified')
      if (listError || !totpFactor) {
        setError('No verified authenticator app found on this account. Ask a super admin to reset your two-factor setup.')
        setPreparing(false)
        return
      }
      setFactorId(totpFactor.id)

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
      if (challengeError || !challenge) {
        setError('Could not start verification. Please refresh and try again.')
        setPreparing(false)
        return
      }
      setChallengeId(challenge.id)
      setPreparing(false)
    }
    prepare()
  }, [router])

  const handleVerify = async () => {
    if (code.trim().length < 6) { setError('Enter the 6-digit code from your authenticator app.'); return }
    setVerifying(true)
    setError('')

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId, code: code.trim() })

    if (verifyError) {
      setError('That code is invalid or expired. Please try again.')
      setCode('')
      setVerifying(false)
      // The spent/expired challenge can't be reused — get a fresh one so
      // the next attempt actually has a chance of succeeding.
      const supabase2 = createClient()
      const { data: challenge } = await supabase2.auth.mfa.challenge({ factorId })
      if (challenge) setChallengeId(challenge.id)
      return
    }

    // Hard redirect so the upgraded (aal2) session cookie is sent on the
    // very next request, same reasoning as the password step.
    window.location.href = '/admin/dashboard'
  }

  const inputClass = "w-full px-4 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-500 shadow-sm"

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Shield className="w-6 h-6 text-orange-500" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            <Logo variant="stacked" tone="reversed" className="h-10 w-auto mx-auto" />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Two-Factor Verification</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          {preparing ? (
            <div className="py-6 text-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
              Preparing verification...
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter the 6-digit code from your authenticator app to finish signing in.
              </p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                disabled={!challengeId}
                className={inputClass + ' tracking-[0.4em] font-mono text-center disabled:opacity-50'}
              />

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying || !challengeId || code.length < 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify & Continue</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
