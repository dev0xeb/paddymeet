'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Check, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const REMEMBER_KEY = 'pm_device_trusted'
const REMEMBER_DAYS = 30

function isDeviceTrusted(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(REMEMBER_KEY)
  if (!stored) return false
  try {
    const { expiry } = JSON.parse(stored)
    return Date.now() < expiry
  } catch {
    return false
  }
}

function trustDevice() {
  const expiry = Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000
  localStorage.setItem(REMEMBER_KEY, JSON.stringify({ trusted: true, expiry }))
}

export default function LoginPage() {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [accountType, setAccountType] = useState<string>('')
  const router = useRouter()

  const inputClass = "w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition-all"

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    const type = data.user?.user_metadata?.account_type || 'explorer'
    setAccountType(type)

    // Check if device is already trusted — skip OTP
    if (isDeviceTrusted()) {
      redirectUser(type)
      return
    }

    // Send OTP to email
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    setLoading(false)
    setStep('otp')
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 8) {
      setError('Please enter the 8-digit code sent to your email.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (verifyError) {
      setError('Invalid or expired code. Please try again.')
      setLoading(false)
      return
    }

    if (rememberDevice) {
      trustDevice()
    }

    redirectUser(accountType)
  }

  const handleResendOtp = async () => {
    setResending(true)
    setError('')
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    setResending(false)
  }

  const redirectUser = (type: string) => {
    if (type === 'organiser') {
      router.push('/organiser/dashboard')
    } else if (type === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="h-16 flex items-center justify-between px-10 border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-orange-500 font-bold hover:underline">Sign up</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Step 1 — Credentials */}
          {step === 'credentials' && (
            <>
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-full text-xs font-bold text-orange-500 uppercase tracking-wider mb-6">
                  Welcome back
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                  Log in to Paddymeet
                </h1>
                <p className="text-gray-500 text-sm">Enter your details to access your account</p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email address</label>
                <input
                  type="email"
                  placeholder="tunde@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className={inputClass}
                />
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                  <Link href="/forgot-password" className="text-xs text-orange-500 font-semibold hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className={inputClass + ' pr-12'}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">{error}</div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-4 text-white text-sm font-bold rounded-xl transition-colors mb-4 ${loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {loading ? 'Logging in...' : 'Continue'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="relative flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-orange-500 font-bold hover:underline">Sign up free</Link>
              </p>
              <p className="text-center text-sm text-gray-500 mt-2">
                Are you an organiser?{' '}
                <Link href="/signup" className="text-blue-500 font-bold hover:underline">Apply here</Link>
              </p>
            </>
          )}

          {/* Step 2 — OTP verification */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-orange-500" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                  Check your email
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  We sent a 6-digit verification code to<br />
                  <span className="font-bold text-gray-700">{email}</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="00000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                  className={inputClass + ' text-center text-2xl font-bold tracking-[0.5em] letter-spacing-wide'}
                />
              </div>

              {/* Remember device */}
              <div
                onClick={() => setRememberDevice(!rememberDevice)}
                className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6 cursor-pointer hover:border-gray-300 transition-colors"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${rememberDevice ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}>
                  {rememberDevice && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Don&apos;t ask again on this device</div>
                  <div className="text-xs text-gray-400 mt-0.5">Skip the verification code for 30 days</div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">{error}</div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 8}
                className={`w-full flex items-center justify-center gap-2 py-4 text-white text-sm font-bold rounded-xl transition-colors mb-4 ${loading || otp.length < 8 ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {loading ? 'Verifying...' : 'Verify & Log In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Didn&apos;t receive the code?</p>
                <button
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-sm font-bold text-orange-500 hover:underline disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => { setStep('credentials'); setOtp(''); setError('') }}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Use a different account
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}