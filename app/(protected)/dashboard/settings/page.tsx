'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  Check,
  Camera,
  ShieldCheck,
  User,
  Sparkles,
  Lock,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Trash2,
  Tag
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

const PRESET_INTERESTS = [
  'Day Parties', 'Sports Events', 'Jazz & Soul', 'Rooftop Parties',
  'Live Music', 'Cultural Festivals', 'Cocktail Events', 'Comedy Shows',
  'Theatre & Arts', 'Club Nights', 'Afrobeats', 'Amapiano',
  'Rave', 'Festival', 'House Music', 'Hip Hop', 'Food & Drinks',
]

const PRESET_AVATARS = [
  { id: 'av1', bg: 'from-orange-500 to-amber-600', name: 'Sunset Amber' },
  { id: 'av2', bg: 'from-purple-600 to-indigo-600', name: 'Royal Indigo' },
  { id: 'av3', bg: 'from-emerald-500 to-teal-600', name: 'Emerald Wave' },
  { id: 'av4', bg: 'from-blue-600 to-cyan-600', name: 'Ocean Cyan' },
  { id: 'av5', bg: 'from-rose-500 to-pink-600', name: 'Neon Rose' },
  { id: 'av6', bg: 'from-slate-800 to-slate-900', name: 'Midnight Charcoal' },
  { id: 'av7', bg: 'from-teal-500 to-emerald-600', name: 'Deep Teal' },
  { id: 'av8', bg: 'from-violet-600 to-purple-800', name: 'Dark Violet' },
  { id: 'av9', bg: 'from-red-500 to-orange-600', name: 'Flame Red' },
  { id: 'av10', bg: 'from-green-600 to-emerald-800', name: 'Forest Green' },
  { id: 'av11', bg: 'from-sky-500 to-blue-700', name: 'Sky Blue' },
  { id: 'av12', bg: 'from-fuchsia-600 to-pink-600', name: 'Electric Magenta' },
]

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

interface Profile {
  username: string
  full_name: string
  email: string
  phone: string
  city: string
  state: string
  age: number
  gender: string
  avatar_url: string
  trust_score: number
  tier: string
}

interface Interest {
  interest: string
}

export default function UserSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [customInterest, setCustomInterest] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'interests' | 'security'>('profile')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        window.location.href = '/login'
        return
      }

      supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data)
            setSelectedAvatar(data.avatar_url || 'from-orange-500 to-amber-600')
          }
        })

      supabase
        .from('user_interests')
        .select('interest')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setInterests(data.map((i: Interest) => i.interest))
        })
    })
  }, [])

  const update = (field: string, value: string | number) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const addCustomInterest = () => {
    const trimmed = customInterest.trim()
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed])
      setCustomInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setInterests((prev) => prev.filter((i) => i !== interest))
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setError('')

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Update profile
      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          city: profile.city,
          state: profile.state,
          gender: profile.gender,
          avatar_url: selectedAvatar,
        })
        .eq('id', user.id)

      if (profileError) {
        setError(profileError.message)
        setSaving(false)
        return
      }

      // Update interests
      await supabase.from('user_interests').delete().eq('user_id', user.id)
      if (interests.length > 0) {
        await supabase
          .from('user_interests')
          .insert(interests.map((interest) => ({ user_id: user.id, interest })))
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  const handlePasswordChange = async (newPassword: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setError(error.message)
    else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const inputClass =
    'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/10 transition-all'
  const labelClass = 'block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2'

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50/70 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const initial = profile.username?.replace('@', '').charAt(0).toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased text-slate-900">
      
      {/* Fixed Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <Link href="/" className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
            paddy<span className="text-orange-600">meet</span>
          </Link>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-sm shadow-orange-600/20 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {saving ? (
            'Saving...'
          ) : saved ? (
            <>
              <Check className="w-4 h-4" /> Changes Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Changes
            </>
          )}
        </button>
      </nav>

      {/* Main Settings Container (Proper Top Padding for Fixed Nav) */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20">
        
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Account Settings
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" /> {profile.tier || 'Elite'} Member
            </span>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Manage your public explorer profile, avatar appearance, event vibe preferences, and security.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Success Notification */}
        {saved && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Profile and settings updated successfully!</span>
          </div>
        )}

        {/* Settings Navigation Tabs */}
        <div className="flex p-1 bg-slate-200/70 rounded-2xl mb-8 gap-1 border border-slate-200">
          {[
            { id: 'profile', label: 'Personal Profile', icon: User },
            { id: 'avatar', label: 'Avatar & Theme', icon: Sparkles },
            { id: 'interests', label: 'Vibes & Interests', icon: Tag },
            { id: 'security', label: 'Security & Password', icon: Lock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl transition-all ${
                activeTab === id
                  ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
            
            {/* Header / Avatar Live Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-50 to-orange-50/30 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
                    selectedAvatar || 'from-orange-500 to-amber-600'
                  } flex items-center justify-center text-white text-2xl font-extrabold shadow-md flex-shrink-0`}
                >
                  {initial}
                </div>
                <div>
                  <div className="text-base font-extrabold text-slate-900">
                    {profile.full_name || profile.username}
                  </div>
                  <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {profile.email}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('avatar')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-orange-600 bg-white hover:bg-orange-50 rounded-xl border border-orange-200 shadow-sm transition-all self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" /> Customize Avatar Theme →
              </button>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={profile.full_name || ''}
                  onChange={(e) => update('full_name', e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Clinton Ayomide"
                />
              </div>

              <div>
                <label className={labelClass}>Username</label>
                <input
                  type="text"
                  value={profile.username || ''}
                  disabled
                  className={inputClass + ' opacity-60 bg-slate-100 cursor-not-allowed'}
                />
                <p className="text-[11px] text-slate-400 mt-1">Username is unique and permanent</p>
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={profile.email || ''}
                    disabled
                    className={inputClass + ' opacity-60 bg-slate-100 cursor-not-allowed pl-10'}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Verified account authentication email</p>
              </div>

              <div>
                <label className={labelClass}>Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => update('phone', e.target.value)}
                    className={inputClass + ' pl-10'}
                    placeholder="+234 800 000 0000"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Used for gate entry and ticket SMS</p>
              </div>

              <div>
                <label className={labelClass}>State</label>
                <select
                  value={profile.state || ''}
                  onChange={(e) => update('state', e.target.value)}
                  className={inputClass + ' cursor-pointer'}
                >
                  <option value="" disabled>
                    Select State
                  </option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>City / Area</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.city || ''}
                    onChange={(e) => update('city', e.target.value)}
                    className={inputClass + ' pl-10'}
                    placeholder="e.g. Lekki, Victoria Island, Ikeja"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Gender Selector */}
            <div>
              <label className={labelClass}>Gender</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['male', 'female', 'other', 'prefer not to say'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => update('gender', g)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all capitalize ${
                      profile.gender === g
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-600/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-60"
              >
                {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Profile Details</>}
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: AVATAR & THEME TAB */}
        {activeTab === 'avatar' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Select Avatar Theme</h2>
              <p className="text-xs text-slate-500">
                Choose a personalized gradient theme that portrays your style across squad chats, attendee lists, and event passes.
              </p>
            </div>

            {/* Current Active Avatar Preview */}
            <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${
                  selectedAvatar || 'from-orange-500 to-amber-600'
                } flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-slate-900/10 flex-shrink-0`}
              >
                {initial}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Current Explorer Avatar</div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Displayed on your digital passes and squad chat tables.
                </p>
              </div>
            </div>

            {/* Avatar Palette Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
              {PRESET_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.bg)}
                  className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    selectedAvatar === avatar.bg
                      ? 'border-orange-500 bg-orange-50/30 ring-2 ring-orange-500/20'
                      : 'border-slate-200/80 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-white text-base font-extrabold shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    {initial}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 truncate w-full text-center">
                    {avatar.name}
                  </span>
                  {selectedAvatar === avatar.bg && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Photo Upload Info Banner */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-200/80 flex items-center justify-center text-slate-600 flex-shrink-0 mt-0.5">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Custom Photo Uploads Coming Soon</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Direct image uploads will be enabled in our next release. For now, choose any of our curated theme palettes above.
                </p>
              </div>
            </div>

            {/* Save Action */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-60"
              >
                {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Apply Avatar Theme</>}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: INTERESTS & VIBES TAB */}
        {activeTab === 'interests' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Your Event Vibes & Interests</h2>
              <p className="text-xs text-slate-500">
                Tell us what you love so our AI matching engine pairs you with the right squad tables and curated events.
              </p>
            </div>

            {/* Selected Interests */}
            <div>
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Selected Interests ({interests.length})</span>
                {interests.length > 0 && (
                  <button
                    onClick={() => setInterests([])}
                    className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold rounded-full shadow-sm"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="hover:bg-orange-200/80 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No interests selected yet. Pick from the popular tags below or add your own.
                </p>
              )}
            </div>

            {/* Popular Interests Preset */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                Explore Popular Vibes
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_INTERESTS.filter((i) => !interests.includes(i)).map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-full hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-700 transition-all"
                  >
                    <Plus className="w-3 h-3 text-slate-400" /> {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Interest Input */}
            <div className="pt-2">
              <label className={labelClass}>Add Custom Vibe / Interest</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomInterest()}
                  placeholder="e.g. Tech Mixer, Afro-Fusion, Board Games..."
                  className={inputClass}
                  maxLength={30}
                />
                <button
                  type="button"
                  onClick={addCustomInterest}
                  disabled={!customInterest.trim()}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
                >
                  Add Tag
                </button>
              </div>
            </div>

            {/* Save Action */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-60"
              >
                {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Interests</>}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY & PASSWORD TAB */}
        {activeTab === 'security' && (
          <SecurityTab
            onPasswordChange={handlePasswordChange}
            error={error}
            saved={saved}
            inputClass={inputClass}
            labelClass={labelClass}
          />
        )}

      </main>
    </div>
  )
}

function SecurityTab({
  onPasswordChange,
  error,
  saved,
  inputClass,
  labelClass,
}: {
  onPasswordChange: (newPass: string) => void
  error: string
  saved: boolean
  inputClass: string
  labelClass: string
}) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [updating, setUpdating] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setLocalError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }
    setLocalError('')
    setUpdating(true)
    onPasswordChange(newPassword)
    setNewPassword('')
    setConfirmPassword('')
    setUpdating(false)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-1">Update Security & Password</h2>
        <p className="text-xs text-slate-500">
          Ensure your account stays secure with a strong password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>New Password</label>
          <div className="relative">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass + ' pl-10'}
              placeholder="Minimum 8 characters with numbers & symbols"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Confirm New Password</label>
          <div className="relative">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass + ' pl-10'}
              placeholder="Re-enter your new password"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          </div>
        </div>

        {(localError || error) && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
            {localError || error}
          </div>
        )}

        {saved && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
            <Check className="w-4 h-4" /> Password updated successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={updating || !newPassword}
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          <Lock className="w-4 h-4" /> Update Password
        </button>
      </form>

      {/* Account Deletion / Danger Zone */}
      <div className="border-t border-slate-100 pt-6 mt-8">
        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm mb-1">
          <Trash2 className="w-4 h-4" /> Danger Zone
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Deleting your account will permanently remove all your tickets, active group chats, trust scores, and profile records. This action cannot be reversed.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to request account deletion? All your active tickets will be permanently removed.')) {
              alert('Account deletion request submitted to support.')
            }
          }}
          className="px-4 py-2.5 border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-xl transition-colors"
        >
          Request Account Deletion
        </button>
      </div>
    </div>
  )
}