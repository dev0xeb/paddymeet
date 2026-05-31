'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Mic, ArrowRight, Check, X } from 'lucide-react'

export default function SignUpPage() {
  const [role, setRole] = useState<'explorer' | 'organiser' | null>(null)

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-10 bg-white border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-orange-500 font-bold hover:underline">Log in</Link>
        </div>
      </nav>

      {!role && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-16">
          <div className="max-w-2xl w-full text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-full text-xs font-bold text-orange-500 uppercase tracking-wider mb-8">
              Create Account
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              I am joining as a...
            </h1>
            <p className="text-gray-500 mb-12 text-base">Choose your account type to get started</p>
            <div className="grid grid-cols-2 gap-5">
              <div
                onClick={() => setRole('explorer')}
                className="group border-2 border-gray-200 rounded-2xl p-8 text-left cursor-pointer hover:border-orange-400 hover:shadow-lg hover:shadow-orange-50 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-5 group-hover:bg-orange-100 transition-colors">
                  <Users className="w-7 h-7 text-orange-500" />
                </div>
                <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2">Free</div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">Explorer</h2>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">Discover events, join groups, buy tickets and build your social reputation.</p>
                <ul className="space-y-2 mb-6">
                  {['Browse and discover events','Join or create groups','Buy solo or group tickets','Build your trust score'].map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-orange-400 flex-shrink-0" />{p}
                    </li>
                  ))}
                </ul>
                <div className="w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-bold text-center flex items-center justify-center gap-2 group-hover:bg-orange-600 transition-colors">
                  Join as Explorer <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div
                onClick={() => setRole('organiser')}
                className="group border-2 border-gray-200 rounded-2xl p-8 text-left cursor-pointer hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                  <Mic className="w-7 h-7 text-blue-500" />
                </div>
                <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Verified only</div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">Organiser</h2>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">List your events on Paddymeet, sell tickets and reach thousands of people.</p>
                <ul className="space-y-2 mb-6">
                  {['Submit and manage events','Sell tickets via Paddymeet','Track sales and revenue','Receive payouts easily'].map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />{p}
                    </li>
                  ))}
                </ul>
                <div className="w-full py-3 rounded-xl bg-blue-500 text-white text-sm font-bold text-center flex items-center justify-center gap-2 group-hover:bg-blue-600 transition-colors">
                  Apply as Organiser <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
            <p className="mt-8 text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-orange-500 font-bold">Log in</Link>
            </p>
          </div>
        </div>
      )}

      {role === 'explorer' && <ExplorerForm onBack={() => setRole(null)} />}
      {role === 'organiser' && <OrganiserForm onBack={() => setRole(null)} />}
    </div>
  )
}

// ── VALIDATION HELPERS ─────────────────────────────────────────
function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '')
  const nigerianLocal = /^0[789][01]\d{8}$/
  const nigerianIntl = /^\+234[789][01]\d{8}$/
  return nigerianLocal.test(cleaned) || nigerianIntl.test(cleaned)
}

function validatePassword(password: string) {
  return {
    minLength: password.length >= 8,
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const checks = validatePassword(password)
  const items = [
    { label: 'At least 8 characters', met: checks.minLength },
    { label: 'At least one number', met: checks.hasNumber },
    { label: 'At least one special character (!@#$%&*)', met: checks.hasSpecial },
  ]
  return (
    <div className="mt-2 space-y-1">
      {items.map(({ label, met }) => (
        <div key={label} className={`flex items-center gap-2 text-xs font-medium ${met ? 'text-green-600' : 'text-gray-400'}`}>
          {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {label}
        </div>
      ))}
    </div>
  )
}

// ── EXPLORER FORM ──────────────────────────────────────────────
function ExplorerForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaChecked, setCaptchaChecked] = useState(false)
  const [termsChecked, setTermsChecked] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    age: 0, username: '', password: '', gender: '', state: '', city: '',
  })

  const update = (field: string, value: string | number) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const interests = [
    'Afrobeats','Live Music','House Music','Hip Hop','Jazz & Soul',
    'Amapiano','Rooftop Parties','Beach Events','Club Nights',
    'Day Parties','Comedy Shows','Theatre & Arts','Cocktail Events',
    'Sports Events','Cultural Festivals','Raves','Food Festivals',
    'Art Exhibitions','Social Meetups','VIP Experiences',
  ]

  const cities: Record<string, string[]> = {
    lagos: ['Lagos Island','Victoria Island','Lekki','Ikeja','Surulere','Yaba','Ajah','Ikoyi','Other'],
    abuja: ['Central Business District','Garki','Wuse','Maitama','Asokoro','Gwarinpa','Other'],
    rivers: ['Port Harcourt','Obio-Akpor','Bonny','Other'],
    oyo: ['Ibadan','Ogbomosho','Oyo','Other'],
    delta: ['Warri','Asaba','Sapele','Other'],
    enugu: ['Enugu','Nsukka','Other'],
    anambra: ['Awka','Onitsha','Nnewi','Other'],
    kano: ['Kano City','Fagge','Other'],
    ogun: ['Abeokuta','Sagamu','Other'],
    kwara: ['Ilorin','Offa','Other'],
    edo: ['Benin City','Auchi','Other'],
    kaduna: ['Kaduna','Zaria','Other'],
  }

  const toggleInterest = (interest: string) =>
    setSelected(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest])

  const pwChecks = validatePassword(formData.password)
  const passwordValid = pwChecks.minLength && pwChecks.hasNumber && pwChecks.hasSpecial
  const phoneValid = validatePhone(formData.phone)

  const step1Valid = !!(formData.firstName && formData.lastName && formData.email &&
    formData.phone && phoneValid && formData.age > 0 && formData.username &&
    passwordValid && formData.gender)

  const step2Valid = !!(formData.state && formData.city)
  const step3Valid = selected.length > 0
  const step4Valid = captchaChecked && termsChecked
  const canSubmit = !!(step1Valid && step2Valid && step3Valid && step4Valid && !loading)

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition-all"

  const nextStep = (current: number, valid: boolean) => {
    if (!valid) {
      setError('Please fill in all required fields correctly before continuing.')
      return
    }
    setError('')
    setStep(current + 1)
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Please complete all required fields and accept the terms.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'explorer', ...formData, interests: selected }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
      } else {
        window.location.href = '/dashboard'
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex pt-16">
      {/* Left panel */}
      <div className="hidden lg:flex w-96 flex-shrink-0 bg-orange-50 border-r border-orange-100 sticky top-16 h-[calc(100vh-64px)] flex-col justify-between p-10 overflow-hidden">
        <div className="relative z-10">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-500 transition-colors mb-8">← Back</button>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 border border-orange-200 rounded-full text-xs font-bold text-orange-600 uppercase tracking-wider mb-5">Explorer Sign Up</div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3">Join the<br /><span className="text-orange-500">crew.</span></h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">Fill in your details and start discovering events near you.</p>
          <div className="space-y-1">
            {['Personal details','Your location','Your interests','Confirm & finish'].map((label, i) => {
              const n = i + 1
              const isDone = step > n
              const isActive = step === n
              return (
                <div key={label}>
                  <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white shadow-sm' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'border-2 border-gray-200 text-gray-400'}`}>
                      {isDone ? <Check className="w-3.5 h-3.5" /> : n}
                    </div>
                    <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-gray-900' : isDone ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {i < 3 && <div className={`w-0.5 h-3 ml-6 rounded-full transition-colors ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />}
                </div>
              )
            })}
          </div>
        </div>
        <div className="relative z-10 space-y-2">
          {['Your data is encrypted and private','Only your username is visible publicly','Takes less than 2 minutes'].map(item => (
            <div key={item} className="flex items-center gap-2 text-xs text-gray-500">
              <Check className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />{item}
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 md:px-12 py-10 md:py-16">

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <div className="text-6xl font-extrabold text-orange-50 leading-none mb-1 select-none">01</div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Personal details</h3>
              <p className="text-sm text-gray-500 mb-2 leading-relaxed">Your real name is for verification only and stays completely private.</p>
              <p className="text-xs text-gray-400 mb-8">All fields are required</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">First name <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="Tunde" value={formData.firstName} onChange={e => update('firstName', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Last name <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="Adeyemi" value={formData.lastName} onChange={e => update('lastName', e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email address <span className="text-red-400">*</span></label>
                <input type="email" placeholder="tunde@email.com" value={formData.email} onChange={e => update('email', e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone number <span className="text-red-400">*</span></label>
                  <input type="tel" placeholder="08012345678" value={formData.phone} onChange={e => update('phone', e.target.value)} className={`${inputClass} ${formData.phone && !phoneValid ? 'border-red-300 focus:border-red-400' : ''}`} />
                  {formData.phone && !phoneValid && (
                    <p className="text-xs text-red-400 mt-1">Enter a valid Nigerian number e.g. 08012345678</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Age <span className="text-red-400">*</span></label>
                  <input type="number" placeholder="24" min="16" max="99" value={formData.age || ''} onChange={e => update('age', parseInt(e.target.value))} className={inputClass} />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Username <span className="text-red-400">*</span></label>
                <input type="text" placeholder="@your_username" value={formData.username} onChange={e => update('username', e.target.value)} className={inputClass} />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password <span className="text-red-400">*</span></label>
                <input type="password" placeholder="Min. 8 characters" value={formData.password} onChange={e => update('password', e.target.value)} className={inputClass} />
                <PasswordStrength password={formData.password} />
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender <span className="text-red-400">*</span></label>
                <select value={formData.gender} onChange={e => update('gender', e.target.value)} className={inputClass + ' appearance-none'}>
                  <option value="" disabled>Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Prefer not to say</option>
                </select>
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">{error}</div>}

              <button onClick={() => nextStep(1, step1Valid)} className="flex items-center gap-2 px-7 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <div className="text-6xl font-extrabold text-orange-50 leading-none mb-1 select-none">02</div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Your location</h3>
              <p className="text-sm text-gray-500 mb-2 leading-relaxed">We use this to show events near you and match you with local groups.</p>
              <p className="text-xs text-gray-400 mb-8">All fields are required</p>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State <span className="text-red-400">*</span></label>
                <select value={formData.state} onChange={e => { update('state', e.target.value); update('city', '') }} className={inputClass + ' appearance-none'}>
                  <option value="" disabled>Select your state</option>
                  <option value="lagos">Lagos</option>
                  <option value="abuja">Abuja (FCT)</option>
                  <option value="rivers">Rivers</option>
                  <option value="oyo">Oyo</option>
                  <option value="delta">Delta</option>
                  <option value="enugu">Enugu</option>
                  <option value="anambra">Anambra</option>
                  <option value="kano">Kano</option>
                  <option value="ogun">Ogun</option>
                  <option value="kwara">Kwara</option>
                  <option value="edo">Edo</option>
                  <option value="kaduna">Kaduna</option>
                </select>
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Closest city <span className="text-red-400">*</span></label>
                <select value={formData.city} onChange={e => update('city', e.target.value)} className={inputClass + ' appearance-none'} disabled={!formData.state}>
                  <option value="" disabled>{formData.state ? 'Select your closest city' : 'Select state first'}</option>
                  {(cities[formData.state] || []).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-2 italic">Can&apos;t find your city? We&apos;ll use your state for now.</p>
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => { setError(''); setStep(1) }} className="px-6 py-3.5 border border-gray-200 text-gray-600 text-sm font-bold rounded-full hover:border-gray-300 transition-colors">Back</button>
                <button onClick={() => nextStep(2, step2Valid)} className="flex items-center gap-2 px-7 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <div className="text-6xl font-extrabold text-orange-50 leading-none mb-1 select-none">03</div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Your interests</h3>
              <p className="text-sm text-gray-500 mb-2 leading-relaxed">Pick everything that excites you — no limit.</p>
              <p className="text-sm text-gray-400 mb-6">
                Selected: <span className="text-orange-500 font-bold">{selected.length}</span> interests
                {selected.length === 0 && <span className="text-red-400 ml-2">— please select at least one</span>}
              </p>
              <div className="flex flex-wrap gap-2.5 mb-8">
                {interests.map(interest => (
                  <button key={interest} onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${selected.includes(interest) ? 'bg-orange-50 border-orange-300 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {interest}
                  </button>
                ))}
              </div>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">{error}</div>}
              <div className="flex gap-3">
                <button onClick={() => { setError(''); setStep(2) }} className="px-6 py-3.5 border border-gray-200 text-gray-600 text-sm font-bold rounded-full hover:border-gray-300 transition-colors">Back</button>
                <button onClick={() => nextStep(3, step3Valid)} className="flex items-center gap-2 px-7 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div>
              <div className="text-6xl font-extrabold text-orange-50 leading-none mb-1 select-none">04</div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Almost there!</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">Confirm you are human and agree to our terms to create your account.</p>

              <div onClick={() => setCaptchaChecked(!captchaChecked)}
                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4 cursor-pointer hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${captchaChecked ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}>
                    {captchaChecked && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">I am not a robot</span>
                </div>
                <div className="text-xs text-gray-400 text-right">
                  <div className="text-lg">🔒</div>
                  <div>reCAPTCHA</div>
                </div>
              </div>

              <div onClick={() => setTermsChecked(!termsChecked)}
                className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6 cursor-pointer hover:border-gray-300 transition-colors">
                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${termsChecked ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}>
                  {termsChecked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  I agree to Paddymeet&apos;s{' '}
                  <Link href="/terms" className="text-orange-500 font-semibold" onClick={e => e.stopPropagation()}>Terms of Use</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-orange-500 font-semibold" onClick={e => e.stopPropagation()}>Privacy Policy</Link>.
                  I understand only my username and avatar are visible to others.
                </p>
              </div>

              {!captchaChecked && <p className="text-xs text-red-400 mb-2">Please confirm you are not a robot</p>}
              {!termsChecked && <p className="text-xs text-red-400 mb-4">Please agree to the terms and privacy policy</p>}
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => { setError(''); setStep(3) }} className="px-6 py-3.5 border border-gray-200 text-gray-600 text-sm font-bold rounded-full hover:border-gray-300 transition-colors">Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`flex items-center gap-2 px-7 py-3.5 text-white text-sm font-bold rounded-full transition-colors ${canSubmit ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                  {loading ? 'Creating account...' : 'Create My Account'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── ORGANISER FORM ─────────────────────────────────────────────
function OrganiserForm({ onBack }: { onBack: () => void }) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [termsChecked, setTermsChecked] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [formData, setFormData] = useState({
    orgName: '', contactName: '', role: '', email: '',
    phone: '', password: '', website: '', description: '',
  })

  const update = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const eventTypes = [
    'Concerts','Club Nights','Day Parties','Arts & Culture',
    'Comedy Shows','Festivals','Exclusive Events','Food & Drinks',
    'Sports Events','Raves',
  ]

  const pwChecks = validatePassword(formData.password)
  const passwordValid = pwChecks.minLength && pwChecks.hasNumber && pwChecks.hasSpecial
  const phoneValid = validatePhone(formData.phone)

  const formValid = !!(formData.orgName && formData.contactName && formData.role &&
    formData.email && formData.phone && phoneValid && passwordValid &&
    formData.description && selected.length > 0 && termsChecked)

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-blue-400 focus:bg-white transition-all"

  const handleSubmit = async () => {
    if (!formValid) {
      setError('Please fill in all required fields correctly, select at least one event type, and accept the terms.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'organiser', ...formData, eventTypes: selected }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex pt-16">
      {/* Left panel */}
      <div className="w-96 flex-shrink-0 bg-blue-50 border-r border-blue-100 sticky top-16 h-[calc(100vh-64px)] flex flex-col justify-between p-10 overflow-hidden">
        <div className="relative z-10">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-500 transition-colors mb-8">← Back</button>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 border border-blue-200 rounded-full text-xs font-bold text-blue-600 uppercase tracking-wider mb-5">Organiser Sign Up</div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3">List your<br /><span className="text-blue-500">events.</span></h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">Tell us about your organisation. Once verified you will get full access to your organiser dashboard.</p>
          <div className="space-y-3">
            {[
              { n: 1, label: 'Fill in your details', desc: 'Tell us about your organisation' },
              { n: 2, label: 'Paddymeet verifies you', desc: 'We will call or email within 24 to 48 hours' },
              { n: 3, label: 'Account activated', desc: 'Start submitting events right away' },
            ].map(({ n, label, desc }) => (
              <div key={n} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-blue-100">
                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{n}</div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 space-y-2">
          {['All organisers are manually verified','Full sales and payout dashboard','Dedicated organiser support'].map(item => (
            <div key={item} className="flex items-center gap-2 text-xs text-gray-500">
              <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />{item}
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-12 py-16">
          {!submitted ? (
            <>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Tell us about your organisation</h3>
              <p className="text-sm text-gray-500 mb-2 leading-relaxed">This information will be used to verify your identity and set up your account.</p>
              <p className="text-xs text-gray-400 mb-8">All fields marked with * are required</p>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Organisation name <span className="text-red-400">*</span></label>
                <input type="text" placeholder="e.g. Lagos Nights Ltd" value={formData.orgName} onChange={e => update('orgName', e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact person <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="Full name" value={formData.contactName} onChange={e => update('contactName', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your role <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="e.g. CEO, Manager" value={formData.role} onChange={e => update('role', e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Business email <span className="text-red-400">*</span></label>
                <input type="email" placeholder="events@yourorganisation.com" value={formData.email} onChange={e => update('email', e.target.value)} className={inputClass} />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone number <span className="text-red-400">*</span></label>
                <input type="tel" placeholder="08012345678" value={formData.phone} onChange={e => update('phone', e.target.value)} className={`${inputClass} ${formData.phone && !phoneValid ? 'border-red-300 focus:border-red-400' : ''}`} />
                {formData.phone && !phoneValid && (
                  <p className="text-xs text-red-400 mt-1">Enter a valid Nigerian number e.g. 08012345678</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password <span className="text-red-400">*</span></label>
                <input type="password" placeholder="Min. 8 characters" value={formData.password} onChange={e => update('password', e.target.value)} className={inputClass} />
                <PasswordStrength password={formData.password} />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Website or social media</label>
                <input type="url" placeholder="https://instagram.com/yourpage" value={formData.website} onChange={e => update('website', e.target.value)} className={inputClass} />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Types of events you organise <span className="text-red-400">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {eventTypes.map(type => (
                    <button key={type}
                      onClick={() => setSelected(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${selected.includes(type) ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {type}
                    </button>
                  ))}
                </div>
                {selected.length === 0 && <p className="text-xs text-red-400 mt-2">Please select at least one event type</p>}
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Brief description <span className="text-red-400">*</span></label>
                <textarea rows={3} placeholder="Tell us about your organisation and the events you run..." value={formData.description} onChange={e => update('description', e.target.value)} className={inputClass + ' resize-none leading-relaxed'} />
              </div>

              <div onClick={() => setTermsChecked(!termsChecked)}
                className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6 cursor-pointer hover:border-blue-200 transition-colors">
                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${termsChecked ? 'bg-blue-500 border-blue-500' : 'border-blue-300 bg-white'}`}>
                  {termsChecked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  I agree to Paddymeet&apos;s{' '}
                  <Link href="/terms" className="text-blue-500 font-semibold" onClick={e => e.stopPropagation()}>Organiser Terms</Link>
                  {' '}and understand my account will only be fully activated after manual verification.
                </p>
              </div>

              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">{error}</div>}

              <button
                onClick={handleSubmit}
                disabled={!formValid || loading}
                className={`w-full flex items-center justify-center gap-2 py-4 text-white text-sm font-bold rounded-xl transition-colors ${formValid && !loading ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center mx-auto mb-6">
                <Check className="w-9 h-9 text-blue-500" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">Application <span className="text-blue-500">submitted!</span></h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed max-w-sm mx-auto">Your application is under review. Our team will reach out within 24 to 48 hours to complete your verification.</p>
              <div className="space-y-3 mb-8 max-w-sm mx-auto">
                {[
                  { n: 1, text: 'Application received — we have got your details' },
                  { n: 2, text: 'Verification call or email within 24 to 48 hours' },
                  { n: 3, text: 'Account activated — start submitting events' },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl text-left">
                    <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{n}</div>
                    <p className="text-xs text-gray-600 font-medium">{text}</p>
                  </div>
                ))}
              </div>
              <Link href="/organiser/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 text-white text-sm font-bold rounded-full hover:bg-blue-600 transition-colors">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}