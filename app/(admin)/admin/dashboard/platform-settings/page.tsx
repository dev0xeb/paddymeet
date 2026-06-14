'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Check, Settings, Shield, DollarSign, Star, Gift } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Settings {
  commission_rate: number
  service_fee_rate: number
  newbie_min: number
  social_min: number
  crew_min: number
  elite_min: number
  legendary_min: number
  max_group_size: number
  payout_hold_days: number
  maintenance_mode: boolean
  referral_signup_points: number
  referral_discount_percent: number
}

export default function AdminPlatformSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    commission_rate: 10,
    service_fee_rate: 5,
    newbie_min: 0,
    social_min: 20,
    crew_min: 40,
    elite_min: 60,
    legendary_min: 80,
    max_group_size: 20,
    payout_hold_days: 2,
    maintenance_mode: false,
    referral_signup_points: 10,
    referral_discount_percent: 10,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('platform_settings').select('*').single()
      .then(({ data }) => {
        if (data) setSettings(data)
        setLoading(false)
      })
  }, [])

  const update = (field: string, value: number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('platform_settings').upsert({ id: 1, ...settings })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 transition-all"
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">Platform Settings</span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">paddy<span className="text-orange-500">meet</span></Link>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60">
          {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</>}
        </button>
      </nav>

      <div className="pt-16 max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Platform Settings</h1>
          <p className="text-sm text-gray-500">Configure global platform rules and rates</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">

            {/* Commission & Fees */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <DollarSign className="w-4 h-4 text-green-500" />
                <h2 className="text-sm font-extrabold text-gray-900">Commission & Fees</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Platform Commission (%)</label>
                  <input type="number" min="0" max="30" value={settings.commission_rate}
                    onChange={e => update('commission_rate', parseFloat(e.target.value))} className={inputClass} />
                  <p className="text-xs text-gray-400 mt-1">Deducted from organiser payouts</p>
                </div>
                <div>
                  <label className={labelClass}>Service Fee (%)</label>
                  <input type="number" min="0" max="20" value={settings.service_fee_rate}
                    onChange={e => update('service_fee_rate', parseFloat(e.target.value))} className={inputClass} />
                  <p className="text-xs text-gray-400 mt-1">Added to ticket price for buyers</p>
                </div>
                <div>
                  <label className={labelClass}>Payout Hold Period (days)</label>
                  <input type="number" min="1" max="14" value={settings.payout_hold_days}
                    onChange={e => update('payout_hold_days', parseInt(e.target.value))} className={inputClass} />
                  <p className="text-xs text-gray-400 mt-1">Days after event before payout is released</p>
                </div>
              </div>
            </div>

            {/* Trust Score Tiers */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-extrabold text-gray-900">Trust Score Tiers</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">Set the minimum trust score required for each tier</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Newbie (min)', field: 'newbie_min', color: 'gray' },
                  { label: 'Social (min)', field: 'social_min', color: 'green' },
                  { label: 'Crew (min)', field: 'crew_min', color: 'blue' },
                  { label: 'Elite (min)', field: 'elite_min', color: 'purple' },
                  { label: 'Legendary (min)', field: 'legendary_min', color: 'orange' },
                ].map(({ label, field, color }) => (
                  <div key={field}>
                    <label className={labelClass}>
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                        color === 'gray' ? 'bg-gray-400' :
                        color === 'green' ? 'bg-green-400' :
                        color === 'blue' ? 'bg-blue-400' :
                        color === 'purple' ? 'bg-purple-400' : 'bg-orange-400'
                      }`} />
                      {label}
                    </label>
                    <input type="number" min="0" max="100"
                      value={settings[field as keyof Settings] as number}
                      onChange={e => update(field, parseInt(e.target.value))} className={inputClass} />
                  </div>
                ))}
              </div>
            </div>

{/* Referral Settings */}
<div className="bg-white border border-gray-100 rounded-2xl p-6">
  <div className="flex items-center gap-2 mb-5">
    <Gift className="w-4 h-4 text-pink-500" />
    <h2 className="text-sm font-extrabold text-gray-900">Referral Program</h2>
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className={labelClass}>Signup Points</label>
      <input type="number" min="0" max="1000" value={settings.referral_signup_points}
        onChange={e => update('referral_signup_points', parseInt(e.target.value))} className={inputClass} />
      <p className="text-xs text-gray-400 mt-1">Points awarded when a referred friend signs up</p>
    </div>
    <div>
      <label className={labelClass}>First Ticket Discount (%)</label>
      <input type="number" min="0" max="100" value={settings.referral_discount_percent}
        onChange={e => update('referral_discount_percent', parseInt(e.target.value))} className={inputClass} />
      <p className="text-xs text-gray-400 mt-1">Discount given when a referred friend gets their first ticket</p>
    </div>
  </div>
</div>

            {/* Maintenance Mode */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-extrabold text-gray-900">Maintenance Mode</h2>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-sm font-bold text-gray-900">Enable Maintenance Mode</div>
                  <div className="text-xs text-gray-500">Shows a maintenance page to all users. Only admins can access the platform.</div>
                </div>
                <button onClick={() => update('maintenance_mode', !settings.maintenance_mode)}
                  className={`w-12 h-6 rounded-full transition-all flex-shrink-0 relative ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.maintenance_mode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-8 py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60">
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}