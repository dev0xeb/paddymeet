'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Users, MapPin, User, Bell, Mail, CheckCircle, Clock, Megaphone } from 'lucide-react'

type AudienceType = 'all' | 'city' | 'individual'
type ChannelType = 'push' | 'email' | 'both'

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

  const canSend = title && message &&
    (audience === 'all' ||
      (audience === 'city' && selectedCity) ||
      (audience === 'individual' && userEmail))

  const handleSend = async () => {
    if (!canSend) return
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
        setTitle('')
        setMessage('')
        setSelectedCity('')
        setUserEmail('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition-all"

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Announcements
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-4xl mx-auto px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Send Announcement</h1>
          <p className="text-sm text-gray-500">Send push notifications and emails to your users</p>
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Left — compose */}
          <div className="col-span-2 space-y-5">

            {/* Success message */}
            {sent && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-green-700">Announcement sent successfully</div>
                  <button onClick={() => setSent(false)} className="text-xs text-green-600 hover:underline mt-0.5">
                    Send another
                  </button>
                </div>
              </div>
            )}

            {/* Audience */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-extrabold text-gray-900 mb-4">Who are you sending to?</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'all', icon: Users, label: 'All Users', desc: 'Every registered user' },
                  { value: 'city', icon: MapPin, label: 'Specific City', desc: 'Users in one city' },
                  { value: 'individual', icon: User, label: 'One User', desc: 'A specific account' },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setAudience(value as AudienceType)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      audience === value
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${audience === value ? 'text-orange-500' : 'text-gray-400'}`} />
                    <div className={`text-sm font-bold ${audience === value ? 'text-orange-600' : 'text-gray-900'}`}>{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>

              {/* City selector */}
              {audience === 'city' && (
                <div className="mt-4">
                  <select
                    value={selectedCity}
                    onChange={e => setSelectedCity(e.target.value)}
                    className={inputClass + ' appearance-none'}
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
                <div className="mt-4">
                  <input
                    type="email"
                    placeholder="Enter user email address"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
            </div>

            {/* Channel */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-extrabold text-gray-900 mb-4">How are you sending it?</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'push', icon: Bell, label: 'Push Only', desc: 'In-app notification' },
                  { value: 'email', icon: Mail, label: 'Email Only', desc: 'Send to inbox' },
                  { value: 'both', icon: Megaphone, label: 'Push + Email', desc: 'Maximum reach' },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setChannel(value as ChannelType)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      channel === value
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${channel === value ? 'text-orange-500' : 'text-gray-400'}`} />
                    <div className={`text-sm font-bold ${channel === value ? 'text-orange-600' : 'text-gray-900'}`}>{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-extrabold text-gray-900 mb-4">Write your message</h2>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. New events this weekend in Lagos"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={80}
                  className={inputClass}
                />
                <div className="text-xs text-gray-400 mt-1 text-right">{title.length}/80</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Write your announcement here..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={500}
                  className={inputClass + ' resize-none leading-relaxed'}
                />
                <div className="text-xs text-gray-400 mt-1 text-right">{message.length}/500</div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={!canSend || loading}
              className={`w-full flex items-center justify-center gap-2 py-4 text-white text-sm font-bold rounded-xl transition-colors ${
                canSend && !loading
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {loading ? 'Sending...' : 'Send Announcement'}
              {!loading && <Send className="w-4 h-4" />}
            </button>

          </div>

          {/* Right — preview and history */}
          <div className="space-y-5">

            {/* Preview */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-extrabold text-gray-900 mb-4">Preview</h2>

              {/* Push notification preview */}
              {(channel === 'push' || channel === 'both') && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Push notification</div>
                  <div className="p-3 bg-gray-900 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-bold text-white">paddymeet</span>
                      <span className="text-xs text-gray-500 ml-auto">now</span>
                    </div>
                    <div className="text-xs font-bold text-white mb-0.5">
                      {title || 'Your announcement title'}
                    </div>
                    <div className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                      {message || 'Your message will appear here...'}
                    </div>
                  </div>
                </div>
              )}

              {/* Email preview */}
              {(channel === 'email' || channel === 'both') && (
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">From: hello@paddymeet.com</div>
                    <div className="text-xs font-bold text-gray-900 mb-2">
                      {title || 'Your announcement title'}
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                      {message || 'Your message will appear here...'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-extrabold text-gray-900 mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Audience</span>
                  <span className="text-xs font-bold text-gray-900 capitalize">
                    {audience === 'all' ? 'All users' : audience === 'city' ? selectedCity || 'Select city' : userEmail || 'Enter email'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Channel</span>
                  <span className="text-xs font-bold text-gray-900 capitalize">
                    {channel === 'both' ? 'Push + Email' : channel === 'push' ? 'Push only' : 'Email only'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className={`text-xs font-bold ${canSend ? 'text-green-600' : 'text-gray-400'}`}>
                    {canSend ? 'Ready to send' : 'Fill in all fields'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent announcements */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-extrabold text-gray-900 mb-4">Recent</h2>
              <div className="space-y-3">
                {[
                  { title: 'Welcome to Paddymeet!', time: '2 days ago', audience: 'All users' },
                  { title: 'New events in Lagos', time: '5 days ago', audience: 'Lagos' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{item.title}</div>
                      <div className="text-xs text-gray-400">{item.audience} · {item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}