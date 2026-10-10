'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Check, Eye, EyeOff, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'

type Step = 'email' | 'code' | 'done'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendCode = async () => {
    if (!email.trim()) { setError('Please enter your email address'); return }
    setLoading(true)
    setError('')

    // A clickable reset link is a GET request that Supabase's own verify
    // endpoint consumes on first hit — including an automated hit from an
    // email provider's link-scanner, before the real user ever clicks it
    // (the same class of problem this app's ticket QR links were already
    // built to avoid). A code sitting as plain text in the email body can't
    // be auto-fetched the same way, so this flow uses that instead of a link.
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)

    if (resetError) {
      setError(resetError.message)
    } else {
      setStep('code')
    }
    setLoading(false)
  }

  const handleReset = async () => {
    if (!code.trim()) { setError('Please enter the code from your email'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'recovery',
    })

    if (verifyError) {
      setError('That code is invalid or has expired. Please request a new one.')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
    } else {
      setStep('done')
      setTimeout(() => router.push('/login'), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Nav */}
      <nav className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100">
        <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          <Logo theme="color" className="h-7 w-auto" />
        </Link>
        <div className="w-24" />
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {step === 'done' ? (
            /* Success state */
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-xl font-extrabold text-gray-900 mb-2">Password updated!</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Your password has been reset successfully. Redirecting you to login...
              </p>
              <Link href="/login"
                className="block w-full py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors text-center"
              >
                Go to Login
              </Link>
            </div>
          ) : step === 'code' ? (
            /* Code + new password form */
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-5">
                <Lock className="w-6 h-6 text-orange-500" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Enter your code</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                We sent a 6-digit code to <span className="font-bold text-gray-700">{email}</span>. Enter it below with your new password.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    maxLength={6}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition-all tracking-[0.3em] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {[
                        { label: 'At least 8 characters', met: password.length >= 8 },
                        { label: 'Contains a number', met: /\d/.test(password) },
                        { label: 'Contains a letter', met: /[a-zA-Z]/.test(password) },
                      ].map(({ label, met }) => (
                        <div key={label} className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300'}`} />
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Confirm new password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition-all"
                  />
                  {confirmPassword.length > 0 && (
                    password === confirmPassword ? (
                      <p className="flex items-center gap-1.5 text-xs text-green-600 mt-1">
                        <Check className="w-3.5 h-3.5" /> Passwords match
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleReset}
                  disabled={loading || !code.trim() || password.length < 8 || password !== confirmPassword}
                  className="w-full py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => { setCode(''); sendCode() }}
                    disabled={loading}
                    className="text-gray-500 hover:text-gray-700 transition-colors font-semibold disabled:opacity-60"
                  >
                    Resend code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email')
                      setCode('')
                      setPassword('')
                      setConfirmPassword('')
                      setError('')
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors font-semibold"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Email form */
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-5">
                <Mail className="w-6 h-6 text-orange-500" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Forgot password?</h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                No worries. Enter your email address and we will send you a code to reset your password.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendCode()}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition-all"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  onClick={sendCode}
                  disabled={loading}
                  className="w-full py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>

                <div className="text-center">
                  <Link href="/login" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                    Remember your password? <span className="font-bold text-orange-500">Log in</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
