'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, X, Check, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const PRESET_INTERESTS = [
  'Day Parties', 'Sports Events', 'Jazz & Soul', 'Rooftop Parties',
  'Live Music', 'Cultural Festivals', 'Cocktail Events', 'Comedy Shows',
  'Theatre & Arts', 'Club Nights', 'Afrobeats', 'Amapiano',
  'Rave', 'Festival', 'House Music', 'Hip Hop', 'Food & Drinks',
]

const PRESET_AVATARS = [
  { id: 'av1', bg: 'from-orange-400 to-pink-500' },
  { id: 'av2', bg: 'from-purple-400 to-blue-500' },
  { id: 'av3', bg: 'from-green-400 to-teal-500' },
  { id: 'av4', bg: 'from-blue-400 to-indigo-500' },
  { id: 'av5', bg: 'from-pink-400 to-rose-500' },
  { id: 'av6', bg: 'from-amber-400 to-orange-500' },
  { id: 'av7', bg: 'from-teal-400 to-cyan-500' },
  { id: 'av8', bg: 'from-violet-400 to-purple-500' },
  { id: 'av9', bg: 'from-red-400 to-pink-500' },
  { id: 'av10', bg: 'from-emerald-400 to-green-500' },
  { id: 'av11', bg: 'from-sky-400 to-blue-500' },
  { id: 'av12', bg: 'from-fuchsia-400 to-pink-500' },
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
      if (!user) { window.location.href = '/login'; return }

      supabase.from('users').select('*').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setProfile(data)
            setSelectedAvatar(data.avatar_url || '')
          }
        })

      supabase.from('user_interests').select('interest').eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setInterests(data.map((i: Interest) => i.interest))
        })
    })
  }, [])

  const update = (field: string, value: string | number) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : prev)
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    )
  }

  const addCustomInterest = () => {
    const trimmed = customInterest.trim()
    if (trimmed && !interests.includes(trimmed)) {
      setInterests(prev => [...prev, trimmed])
      setCustomInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    setInterests(prev => prev.filter(i => i !== interest))
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
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

      if (profileError) { setError(profileError.message); setSaving(false); return }

      // Update interests — delete all and re-insert
      await supabase.from('user_interests').delete().eq('user_id', user.id)
      if (interests.length > 0) {
        await supabase.from('user_interests').insert(
          interests.map(interest => ({ user_id: user.id, interest }))
        )
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setError(error.message)
    else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition-all"
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const initial = profile.username?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-10 bg-white border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </nav>

      <div className="pt-16 max-w-3xl mx-auto px-4 md:px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Settings</h1>
          <p className="text-sm text-gray-500">Manage your profile, avatar and preferences</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {(['profile', 'avatar', 'interests', 'security'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="text-sm font-extrabold text-gray-900">Personal Information</h2>

            {/* Preview */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${selectedAvatar || 'from-orange-400 to-pink-500'} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
                {initial}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">{profile.username}</div>
                <div className="text-xs text-gray-500">{profile.email}</div>
                <button onClick={() => setActiveTab('avatar')} className="text-xs font-bold text-orange-500 hover:underline mt-0.5">
                  Change avatar →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full name</label>
                <input type="text" value={profile.full_name || ''} onChange={e => update('full_name', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Username</label>
                <input type="text" value={profile.username || ''} disabled className={inputClass + ' opacity-50 cursor-not-allowed'} />
                <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
              </div>
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={profile.email || ''} disabled className={inputClass + ' opacity-50 cursor-not-allowed'} />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className={labelClass}>Phone number</label>
              <input type="tel" value={profile.phone || ''} onChange={e => update('phone', e.target.value)} className={inputClass} placeholder="+234..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>State</label>
                <select value={profile.state || ''} onChange={e => update('state', e.target.value)} className={inputClass + ' appearance-none'}>
                  <option value="" disabled>Select state</option>
                  {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input type="text" value={profile.city || ''} onChange={e => update('city', e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Gender</label>
              <div className="flex gap-3">
                {['male', 'female', 'other', 'prefer not to say'].map(g => (
                  <button key={g} onClick={() => update('gender', g)}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all capitalize ${
                      profile.gender === g ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Avatar tab */}
        {activeTab === 'avatar' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-extrabold text-gray-900 mb-2">Choose Your Avatar</h2>
            <p className="text-xs text-gray-500 mb-6">Pick a colour theme for your avatar. Your initials will be displayed on top.</p>

            {/* Current */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${selectedAvatar || 'from-orange-400 to-pink-500'} flex items-center justify-center text-white text-2xl font-bold flex-shrink-0`}>
                {initial}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">Current avatar</div>
                <div className="text-xs text-gray-500">Your avatar shows across the platform</div>
              </div>
            </div>

            {/* Avatar grid */}
            <div className="grid grid-cols-6 gap-3">
              {PRESET_AVATARS.map(avatar => (
                <button key={avatar.id} onClick={() => setSelectedAvatar(avatar.bg)}
                  className={`relative w-full aspect-square rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-white text-lg font-bold transition-all hover:scale-105 ${
                    selectedAvatar === avatar.bg ? 'ring-4 ring-orange-500 ring-offset-2' : ''
                  }`}>
                  {initial}
                  {selectedAvatar === avatar.bg && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold text-gray-600">Photo upload coming soon</span>
              </div>
              <p className="text-xs text-gray-400">We are working on custom photo uploads. For now choose from the avatar colours above.</p>
            </div>
          </div>
        )}

        {/* Interests tab */}
        {activeTab === 'interests' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-extrabold text-gray-900 mb-2">Your Interests</h2>
            <p className="text-xs text-gray-500 mb-5">These help us match you with the right events and groups.</p>

            {/* Selected */}
            {interests.length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Selected ({interests.length})</div>
                <div className="flex flex-wrap gap-2">
                  {interests.map(interest => (
                    <span key={interest} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold rounded-full">
                      {interest}
                      <button onClick={() => removeInterest(interest)} className="hover:text-orange-800">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preset interests */}
            <div className="mb-5">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Popular interests</div>
              <div className="flex flex-wrap gap-2">
                {PRESET_INTERESTS.filter(i => !interests.includes(i)).map(interest => (
                  <button key={interest} onClick={() => toggleInterest(interest)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold rounded-full hover:border-orange-300 hover:text-orange-500 transition-all">
                    <Plus className="w-3 h-3" /> {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom interest */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Add custom interest</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInterest}
                  onChange={e => setCustomInterest(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomInterest()}
                  placeholder="Type an interest and press Enter..."
                  className={inputClass}
                  maxLength={30}
                />
                <button onClick={addCustomInterest} disabled={!customInterest.trim()}
                  className="px-4 py-3 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50">
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <SecurityTab onPasswordChange={handlePasswordChange} error={error} saved={saved} />
        )}

        {/* Save button */}
        {activeTab !== 'security' && (
          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-8 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SecurityTab({ onPasswordChange, error, saved }: {
  onPasswordChange: (current: string, newPass: string) => void
  error: string
  saved: boolean
}) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = () => {
    if (newPassword.length < 8) { setLocalError('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setLocalError('Passwords do not match'); return }
    setLocalError('')
    onPasswordChange('', newPassword)
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition-all"
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <h2 className="text-sm font-extrabold text-gray-900">Change Password</h2>
      <div>
        <label className={labelClass}>New password</label>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} placeholder="Minimum 8 characters" />
      </div>
      <div>
        <label className={labelClass}>Confirm new password</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} />
      </div>
      {(localError || error) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{localError || error}</div>
      )}
      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 flex items-center gap-2">
          <Check className="w-4 h-4" /> Password updated successfully
        </div>
      )}
      <button onClick={handleSubmit}
        className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
        <Save className="w-4 h-4" /> Update Password
      </button>

      {/* Danger zone */}
      <div className="border-t border-gray-100 pt-5 mt-5">
        <h2 className="text-sm font-extrabold text-red-500 mb-3">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Deleting your account is permanent and cannot be undone. All your data, tickets and group memberships will be removed.
        </p>
        <button className="px-5 py-2.5 border-2 border-red-200 text-red-500 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors">
          Delete My Account
        </button>
      </div>
    </div>
  )
}