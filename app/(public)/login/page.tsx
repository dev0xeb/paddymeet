'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Check, Shield, Users, Mic } from 'lucide-react'
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
  const [loginAs, setLoginAs] = useState<'explorer' | 'organiser'>('explorer')
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)
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
      email: email.trim().toLowerCase(),
      password,
    })

    if (authError) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    let type = data.user?.user_metadata?.account_type

    // If metadata is empty, verify against organisers table
    if (!type) {
      const { data: org } = await supabase
        .from('organisers')
        .select('id')
        .eq('id', data.user.id)
        .single()
      type = org ? 'organiser' : 'explorer'
    }

    setAccountType(type)

    // Validate account type matches selected login type
    if (loginAs === 'organiser' && type !== 'organiser') {
      await supabase.auth.signOut()
      setError('No organiser account found with these credentials. Try logging in as Explorer.')
      setLoading(false)
      return
    }

    if (loginAs === 'explorer' && type === 'organiser') {
      await supabase.auth.signOut()
      setError('This is an organiser account. Please use the Organiser tab to log in.')
      setLoading(false)
      return
    }

    // Check if device is trusted — skip OTP for 30 days
    if (isDeviceTrusted()) {
      redirectUser(type)
      return
    }

    // Send 6-digit OTP
    await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    })

    setLoading(false)
    setStep('otp')
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit verification code sent to your email.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email',
    })

    if (verifyError) {
      setError('Invalid or expired 6-digit code. Please try again.')
      setLoading(false)
      return
    }

    if (rememberDevice) trustDevice()
    redirectUser(accountType)
  }

  const handleResendOtp = async () => {
    setResending(true)
    setError('')
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    })
    setResending(false)
  }

  const redirectUser = (type: string) => {
    if (type === 'organiser') {
      router.push('/organiser/dashboard')
    } else {
      router.push('/dashboard')
    }
  }

  const accentColor = loginAs === 'organiser' ? 'blue' : 'orange'

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Nav */}
      <nav className="h-16 flex items-center justify-between px-6 md:px-10 border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="text-sm text-gray-500 hidden sm:block">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-orange-500 font-bold hover:underline">Sign up</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Step 1 — Credentials */}
          {step === 'credentials' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                  Welcome back
                </h1>
                <p className="text-gray-500 text-sm">Log in to your Paddymeet account</p>
              </div>

              {/* Account type toggle */}
              <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl mb-6">
                <button
                  onClick={() => { setLoginAs('explorer'); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    loginAs === 'explorer'
                      ? 'bg-white text-orange-500 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Explorer
                </button>
                <button
                  onClick={() => { setLoginAs('organiser'); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    loginAs === 'organiser'
                      ? 'bg-white text-blue-500 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  Organiser
                </button>
              </div>

              {/* Context message */}
              <div className={`flex items-center gap-2 p-3 rounded-xl mb-6 text-xs font-medium ${
                loginAs === 'organiser'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-orange-50 text-orange-600'
              }`}>
                {loginAs === 'organiser'
                  ? '🎤 Logging in as an Organiser — you\'ll be taken to your organiser dashboard.'
                  : '👥 Logging in as an Explorer — you\'ll be taken to your personal dashboard.'}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className={inputClass}
                />
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Password
                  </label>
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-4 text-white text-sm font-bold rounded-xl transition-colors mb-4 ${
                  loading ? 'bg-gray-300 cursor-not-allowed' :
                  loginAs === 'organiser' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {loading ? 'Logging in...' : `Log In as ${loginAs === 'organiser' ? 'Organiser' : 'Explorer'}`}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="relative flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <p className="text-center text-sm text-gray-500 mb-2">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-orange-500 font-bold hover:underline">Sign up free</Link>
              </p>
              <p className="text-center text-xs text-gray-400">
                Admin?{' '}
                <Link href="/admin-login" className="text-gray-500 font-semibold hover:underline">Sign in here</Link>
              </p>
            </>
          )}

          {/* Step 2 — OTP */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
                  accentColor === 'blue' ? 'bg-blue-50 border border-blue-100' : 'bg-orange-50 border border-orange-100'
                }`}>
                  <Shield className={`w-8 h-8 ${accentColor === 'blue' ? 'text-blue-500' : 'text-orange-500'}`} />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
                  Check your email
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  We sent a 6-digit verification code to<br />
                  <span className="font-bold text-gray-700">{email}</span>
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                  className={inputClass + ' text-center text-3xl font-mono font-bold tracking-[0.3em] py-4'}
                />
              </div>

              {/* Remember device for 30 days */}
              <div
                onClick={() => setRememberDevice(!rememberDevice)}
                className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl mb-5 cursor-pointer hover:border-gray-300 transition-colors"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  rememberDevice
                    ? accentColor === 'blue' ? 'bg-blue-500 border-blue-500' : 'bg-orange-500 border-orange-500'
                    : 'border-gray-300 bg-white'
                }`}>
                  {rememberDevice && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">Don&apos;t ask again on this device</div>
                  <div className="text-xs text-gray-400 mt-0.5">Skip code verification for 30 days</div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
                className={`w-full flex items-center justify-center gap-2 py-4 text-white text-sm font-bold rounded-xl transition-colors mb-4 ${
                  loading || otp.length < 6 ? 'bg-gray-300 cursor-not-allowed' :
                  accentColor === 'blue' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {loading ? 'Verifying...' : 'Verify & Log In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mb-1">Didn&apos;t receive the code?</p>
                <button
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-sm font-bold text-orange-500 hover:underline disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
              </div>

              <div className="text-center">
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