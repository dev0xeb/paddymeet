'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Send, Users, MapPin, User, Bell, Mail,
  CheckCircle, Clock, Megaphone, ShieldCheck, Building2,
  AlertCircle, Loader2, Sparkles
} from 'lucide-react'

type AudienceType = 'all' | 'organisers' | 'verified_organisers' | 'city' | 'individual'
type ChannelType = 'push' | 'email' | 'both'

interface RecentAnnouncement {
  id: string
  title: string
  message: string
  audience: string
  channel: string
  sent_at: string
  sent_to_count: number
}

const cities = [
  'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Warri',
  'Enugu', 'Benin City', 'Kano', 'Kaduna', 'Abeokuta'
]

export default function AdminAnnouncementsPage() {
  const [audience, setAudience] = useState<AudienceType>('all')
  const [channel, setChannel] = useState<ChannelType>('both')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [sentCount, setSentCount] = useState(0)

  const [counts, setCounts] = useState({ users: 0, organisers: 0, verifiedOrganisers: 0 })
  const [recentList, setRecentList] = useState<RecentAnnouncement[]>([])

  const fetchStatsAndHistory = async () => {
    try {
      const res = await fetch('/api/admin/announcements')
      const data = await res.json()
      if (data.counts) setCounts(data.counts)
      if (data.recentAnnouncements) setRecentList(data.recentAnnouncements)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchStatsAndHistory()
  }, [])

  const canSend = Boolean(
    title.trim() &&
    message.trim() &&
    (audience === 'all' ||
      audience === 'organisers' ||
      audience === 'verified_organisers' ||
      (audience === 'city' && selectedCity) ||
      (audience === 'individual' && userEmail.trim()))
  )

  const getEstimatedReach = () => {
    if (audience === 'all') return `${counts.users} registered user${counts.users === 1 ? '' : 's'}`
    if (audience === 'organisers') return `${counts.organisers} event host${counts.organisers === 1 ? '' : 's'}`
    if (audience === 'verified_organisers') return `${counts.verifiedOrganisers} verified host${counts.verifiedOrganisers === 1 ? '' : 's'}`
    if (audience === 'city') return selectedCity ? `Users in ${selectedCity}` : 'Select a city'
    if (audience === 'individual') return userEmail ? `1 direct account` : 'Enter email'
    return '0 recipients'
  }

  const handleSend = async () => {
    if (!canSend || loading) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          audience,
          channel,
          city: audience === 'city' ? selectedCity : null,
          user_email: audience === 'individual' ? userEmail : null,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSent(true)
        setSentCount(data.sent_to || 0)
        setTitle('')
        setMessage('')
        setSelectedCity('')
        setUserEmail('')
        fetchStatsAndHistory()
      }
    } catch {
      setError('Something went wrong sending the announcement. Please try again.')
    }
    setLoading(false)
  }

  const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all shadow-sm"

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
          <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Broadcast Centre
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Broadcast Announcement</h1>
          <p className="text-xs text-slate-500">Send push notifications and official email blasts to users and event hosts.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column (2 Cols) — Compose */}
          <div className="lg:col-span-2 space-y-6">

            {/* Success message */}
            {sent && (
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-fade-in shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-800">Announcement broadcasted successfully!</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      Delivered to <strong>{sentCount}</strong> active recipient{sentCount === 1 ? '' : 's'}.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  Send another
                </button>
              </div>
            )}

            {/* Step 1: Target Audience */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">1. Select Target Audience</h2>
                <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  Est. Reach: {getEstimatedReach()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'all', icon: Users, label: 'All Attendees', desc: `Every user (~${counts.users})` },
                  { value: 'organisers', icon: Building2, label: 'All Hosts', desc: `All organisers (~${counts.organisers})` },
                  { value: 'verified_organisers', icon: ShieldCheck, label: 'Verified Hosts', desc: `Verified hosts (~${counts.verifiedOrganisers})` },
                  { value: 'city', icon: MapPin, label: 'Specific City', desc: 'Users in a selected city' },
                  { value: 'individual', icon: User, label: 'Single Account', desc: 'Specific email address' },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAudience(value as AudienceType)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      audience === value
                        ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-2 ${audience === value ? 'text-orange-600' : 'text-slate-400'}`} />
                    <div className={`text-xs font-bold ${audience === value ? 'text-orange-950' : 'text-slate-900'}`}>{label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{desc}</div>
                  </button>
                ))}
              </div>

              {/* City selector */}
              {audience === 'city' && (
                <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Choose Target City
                  </label>
                  <select
                    value={selectedCity}
                    onChange={e => setSelectedCity(e.target.value)}
                    className={inputClass}
                  >
                    <option value="" disabled>Select a city</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Individual user */}
              {audience === 'individual' && (
                <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter attendee or organiser email"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {/* Step 2: Delivery Channels */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4">2. Delivery Channels</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'push', icon: Bell, label: 'Push Only', desc: 'In-app notification badge' },
                  { value: 'email', icon: Mail, label: 'Email Only', desc: 'Delivered directly to inbox' },
                  { value: 'both', icon: Megaphone, label: 'Push + Email', desc: 'Maximum visibility & reach' },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setChannel(value as ChannelType)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      channel === value
                        ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-2 ${channel === value ? 'text-orange-600' : 'text-slate-400'}`} />
                    <div className={`text-xs font-bold ${channel === value ? 'text-orange-950' : 'text-slate-900'}`}>{label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Message Content */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-4">3. Message Content</h2>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Announcement Subject / Title <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{title.length}/80</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Major platform update for upcoming weekend events"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={80}
                  className={inputClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Message Body <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{message.length}/500</span>
                </div>
                <textarea
                  rows={5}
                  placeholder="Type your official announcement here..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={500}
                  className={inputClass + ' resize-none leading-relaxed'}
                />
              </div>

              {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

          </div>

          {/* Right Column (1 Col) — Summary, Action & Preview */}
          <div className="space-y-6">

            {/* Broadcast Action & Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Broadcast Summary</h2>
              
              <div className="space-y-2.5 mb-5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Target Audience</span>
                  <span className="font-semibold text-slate-900 capitalize text-right">
                    {audience === 'all' ? 'All Attendees' :
                     audience === 'organisers' ? 'All Hosts' :
                     audience === 'verified_organisers' ? 'Verified Hosts' :
                     audience === 'city' ? selectedCity || 'Choose city' : userEmail || 'Enter email'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Est. Reach</span>
                  <span className="font-semibold text-orange-600">{getEstimatedReach()}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Channel</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {channel === 'both' ? 'Push + Email' : channel === 'push' ? 'Push only' : 'Email only'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Status</span>
                  <span className={`font-semibold ${canSend ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {canSend ? 'Ready to broadcast' : 'Fill required fields'}
                  </span>
                </div>
              </div>

              {/* Primary Send Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend || loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting Message...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Announcement Now</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Previews */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Live Notification Preview</h2>

              {/* Push notification preview */}
              {(channel === 'push' || channel === 'both') && (
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2">Push Notification (Lock Screen)</div>
                  <div className="p-3.5 bg-slate-900 rounded-2xl text-white shadow-md border border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-md bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-bold">paddymeet</span>
                      <span className="text-[10px] text-slate-400 ml-auto">Just now</span>
                    </div>
                    <div className="text-xs font-bold mb-0.5">
                      {title || 'Announcement Title'}
                    </div>
                    <div className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                      {message || 'Your message preview will appear here in real-time...'}
                    </div>
                  </div>
                </div>
              )}

              {/* Email preview */}
              {(channel === 'email' || channel === 'both') && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-2">Email Inbox Preview</div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-400 mb-1">From: hello@paddymeet.com</div>
                    <div className="text-xs font-bold text-slate-900 mb-1.5">
                      {title || 'Announcement Subject'}
                    </div>
                    <div className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                      {message || 'Email announcement body will render here...'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Announcements History */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Recent Broadcasts</h2>
              {recentList && recentList.length > 0 ? (
                <div className="space-y-2.5">
                  {recentList.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="font-bold text-slate-900 truncate mb-0.5">{item.title}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="capitalize">{item.audience.replace('_', ' ')}</span>
                        <span>{item.sent_to_count} recipients</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                  <Clock className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-400">No previous broadcasts yet</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}