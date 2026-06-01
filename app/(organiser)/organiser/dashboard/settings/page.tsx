'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Building2, User, CreditCard, Globe, Check, Eye, EyeOff } from 'lucide-react'

interface OrganiserProfile {
  id: string
  org_name: string
  contact_name: string
  email: string
  phone: string
  description: string
  website: string
  social_link: string
  bank_name: string
  account_number: string
  account_name: string
}

const nigerianBanks = [
  'Access Bank', 'First Bank', 'GT Bank', 'UBA', 'Zenith Bank',
  'Fidelity Bank', 'FCMB', 'Sterling Bank', 'Union Bank', 'Stanbic IBTC',
  'Polaris Bank', 'Wema Bank', 'Keystone Bank', 'Heritage Bank',
  'Opay', 'Kuda Bank', 'Moniepoint', 'PalmPay', 'Carbon',
]

async function getProfile(): Promise<OrganiserProfile | null> {
  try {
    const res = await fetch('/api/organiser/profile')
    const data = await res.json()
    return data.organiser || null
  } catch {
    return null
  }
}

export default function OrganiserSettingsPage() {
  const [profile, setProfile] = useState<OrganiserProfile | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'bank' | 'security'>('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showAccountNumber, setShowAccountNumber] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  useEffect(() => {
    getProfile().then(data => {
      if (data) setProfile(data)
      setLoaded(true)
    })
  }, [])

  const updateField = (field: keyof OrganiserProfile, value: string) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : prev)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/organiser/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  const handleSaveBank = async () => {
    if (!profile?.bank_name || !profile?.account_number || !profile?.account_name) {
      setError('Please fill in all bank details')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/organiser/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_name: profile.bank_name,
          account_number: profile.account_number,
          account_name: profile.account_name,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/organiser/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSaved(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSaving(false)
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-blue-400 focus:bg-white transition-all"

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'bank', label: 'Bank Details', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Building2 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/organiser/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Settings
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="w-24" />
      </nav>

      <div className="pt-16 max-w-3xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Settings</h1>
          <p className="text-sm text-gray-500">Manage your organiser profile and account settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id}
              onClick={() => { setActiveTab(id as 'profile' | 'bank' | 'security'); setError(''); setSaved(false) }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {!loaded ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {/* Success message */}
            {saved && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl mb-5">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-green-700">Changes saved successfully</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-5">{error}</div>
            )}

            {/* Profile tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Organisation Name</label>
                    <input type="text" value={profile?.org_name || ''} onChange={e => updateField('org_name', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Name</label>
                    <input type="text" value={profile?.contact_name || ''} onChange={e => updateField('contact_name', e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                    <input type="email" value={profile?.email || ''} disabled className={inputClass + ' opacity-60 cursor-not-allowed'} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone</label>
                    <input type="tel" value={profile?.phone || ''} onChange={e => updateField('phone', e.target.value)} placeholder="+234..." className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                  <textarea rows={3} value={profile?.description || ''} onChange={e => updateField('description', e.target.value)}
                    placeholder="Tell people about your organisation..."
                    className={inputClass + ' resize-none leading-relaxed'} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      <Globe className="w-3 h-3 inline mr-1" /> Website
                    </label>
                    <input type="url" value={profile?.website || ''} onChange={e => updateField('website', e.target.value)} placeholder="https://yourwebsite.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Social Link</label>
                    <input type="url" value={profile?.social_link || ''} onChange={e => updateField('social_link', e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
                  </div>
                </div>

                <button onClick={handleSaveProfile} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {saving ? 'Saving...' : 'Save Profile'}
                  {!saving && <Save className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Bank details tab */}
            {activeTab === 'bank' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600 leading-relaxed">
                  Your bank details are encrypted and stored securely. Paddymeet uses these details to process payouts after your events.
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bank Name</label>
                  <select value={profile?.bank_name || ''} onChange={e => updateField('bank_name', e.target.value)}
                    className={inputClass + ' appearance-none'}>
                    <option value="" disabled>Select your bank</option>
                    {nigerianBanks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Name</label>
                  <input type="text" value={profile?.account_name || ''} onChange={e => updateField('account_name', e.target.value)}
                    placeholder="Name on the account" className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Number</label>
                  <div className="relative">
                    <input
                      type={showAccountNumber ? 'text' : 'password'}
                      value={profile?.account_number || ''}
                      onChange={e => updateField('account_number', e.target.value)}
                      placeholder="10-digit account number"
                      maxLength={10}
                      className={inputClass + ' pr-10'}
                    />
                    <button onClick={() => setShowAccountNumber(!showAccountNumber)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showAccountNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button onClick={handleSaveBank} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {saving ? 'Saving...' : 'Save Bank Details'}
                  {!saving && <Save className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Security tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900 mb-1">Change Password</h2>
                  <p className="text-xs text-gray-500 mb-5">Make sure your password is at least 8 characters long.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                      <div className="relative">
                        <input type={showCurrentPw ? 'text' : 'password'} value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)} placeholder="Your current password"
                          className={inputClass + ' pr-10'} />
                        <button onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                      <div className="relative">
                        <input type={showNewPw ? 'text' : 'password'} value={newPassword}
                          onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters"
                          className={inputClass + ' pr-10'} />
                        <button onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your new password" className={inputClass} />
                    </div>
                  </div>
                </div>

                <button onClick={handleChangePassword} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {saving ? 'Updating...' : 'Update Password'}
                  {!saving && <Save className="w-4 h-4" />}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}