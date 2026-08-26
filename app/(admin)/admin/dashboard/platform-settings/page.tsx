'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Save, Check, Shield, DollarSign, Star, Gift,
  AlertTriangle, Loader2, Sparkles, Sliders, RefreshCw, X
} from 'lucide-react'
import ProcessGroupDeadlinesButton from '@/components/admin/ProcessGroupDeadlinesButton'

interface PlatformSettings {
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

const defaultSettings: PlatformSettings = {
  commission_rate: 5,
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
}

export default function AdminPlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [maintenanceConfirmModal, setMaintenanceConfirmModal] = useState(false)

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/platform-settings')
      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const updateField = (field: keyof PlatformSettings, val: number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: val }))
  }

  const handleMaintenanceToggle = () => {
    if (!settings.maintenance_mode) {
      setMaintenanceConfirmModal(true)
    } else {
      updateField('maintenance_mode', false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/platform-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all shadow-xs"
  const labelClass = "block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5"

  return (
    <div className="min-h-screen bg-slate-50 antialiased">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-slate-700" />
          <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            System Control Room
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Saved Successfully</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Platform Rules</span>
              </>
            )}
          </button>

          <Link href="/" className="text-lg font-bold text-white tracking-tight pl-2">
            paddy<span className="text-orange-500">meet</span>
          </Link>
        </div>
      </nav>

      <div className="pt-16 max-w-4xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Global Platform Settings</h1>
          <p className="text-xs text-slate-500">Configure financial take rates, community trust score gates, and system operations.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-orange-500" />
            Loading system configuration...
          </div>
        ) : (
          <div className="space-y-6">

            {/* 1. Commission & Take Rates */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">1. Financial Commission & Fees</h2>
                  <p className="text-[11px] text-slate-400">Platform take rates and security hold periods</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Platform Commission (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.5"
                    value={settings.commission_rate}
                    onChange={e => updateField('commission_rate', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Deducted from gross organiser payouts (Current: {settings.commission_rate}%)</p>
                </div>

                <div>
                  <label className={labelClass}>Buyer Service Fee (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={settings.service_fee_rate}
                    onChange={e => updateField('service_fee_rate', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Added to ticket checkout for buyers</p>
                </div>

                <div>
                  <label className={labelClass}>Payout Hold Period (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.payout_hold_days}
                    onChange={e => updateField('payout_hold_days', parseInt(e.target.value) || 1)}
                    className={inputClass}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Days after event before funds unlock</p>
                </div>
              </div>
            </div>

            {/* 2. Trust Score Reputation Tiers */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">2. Trust Score Reputation Tiers</h2>
                  <p className="text-[11px] text-slate-400">Configure minimum point thresholds required for each attendee badge</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Newbie (Min)', field: 'newbie_min' as const, color: 'bg-slate-400' },
                  { label: 'Social (Min)', field: 'social_min' as const, color: 'bg-emerald-500' },
                  { label: 'Crew (Min)', field: 'crew_min' as const, color: 'bg-blue-500' },
                  { label: 'Elite (Min)', field: 'elite_min' as const, color: 'bg-purple-500' },
                  { label: 'Legendary (Min)', field: 'legendary_min' as const, color: 'bg-orange-500' },
                ].map(({ label, field, color }) => (
                  <div key={field}>
                    <label className={labelClass}>
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${color}`} />
                      {label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings[field]}
                      onChange={e => updateField(field, parseInt(e.target.value) || 0)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Referral Program */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">3. Referral & Viral Growth</h2>
                  <p className="text-[11px] text-slate-400">Incentives for attendees inviting friends to join events</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Referral Signup Bonus (Points)</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={settings.referral_signup_points}
                    onChange={e => updateField('referral_signup_points', parseInt(e.target.value) || 0)}
                    className={inputClass}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Trust points awarded when referred friend signs up</p>
                </div>

                <div>
                  <label className={labelClass}>First Ticket Purchase Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.referral_discount_percent}
                    onChange={e => updateField('referral_discount_percent', parseInt(e.target.value) || 0)}
                    className={inputClass}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Automatic checkout discount on friend&apos;s first ticket</p>
                </div>
              </div>
            </div>

            {/* 4. Emergency Maintenance Mode */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">4. Emergency Maintenance Mode</h2>
                  <p className="text-[11px] text-slate-400">Lock down the public website during major updates or database maintenance</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-0.5">
                    {settings.maintenance_mode ? '🚨 Platform is in Maintenance Mode' : 'Platform is Live and Operational'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {settings.maintenance_mode
                      ? 'Public visitors see a maintenance screen. Only logged-in administrators can access the system.'
                      : 'All public pages, event booking, and checkout flows are running normally.'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleMaintenanceToggle}
                  className={`w-12 h-6 rounded-full transition-all flex-shrink-0 relative ${
                    settings.maintenance_mode ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                      settings.maintenance_mode ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 5. Group Ticket Processing Tools */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">5. Social Squad & Group Ticket Tools</h2>
                  <p className="text-[11px] text-slate-400">Manual trigger for the automated group ticket deadline processor</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Runs automatically every hour via background cron. Click below to trigger an immediate manual pass to merge incomplete squads and issue group tickets.
              </p>
              
              <ProcessGroupDeadlinesButton />
            </div>

          </div>
        )}

      </div>

      {/* Confirmation Modal for Maintenance Mode */}
      {maintenanceConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative text-left">
            <button
              onClick={() => setMaintenanceConfirmModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Enable Maintenance Mode?</h3>
                <p className="text-xs text-slate-500">This will lock the platform for all attendees and hosts</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100">
              While active, the public website will show a maintenance banner and pause ticket checkouts. Only administrators with active sessions can access the site.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  updateField('maintenance_mode', true)
                  setMaintenanceConfirmModal(false)
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Yes, Enable Maintenance Mode
              </button>
              <button
                type="button"
                onClick={() => setMaintenanceConfirmModal(false)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}