import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Settings, Shield, Star, Users, Calendar,
  MapPin, Edit3, Bell, LogOut, ChevronRight, Ticket
} from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, user_interests(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, events(title, event_date, venue_name, city)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: trustHistory } = await supabase
    .from('trust_score_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const tierColors: Record<string, { bg: string, text: string, border: string }> = {
    Newbie: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
    Social: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    Crew: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    Elite: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    Legendary: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  }

  const tier = profile.tier || 'Newbie'
  const tierColor = tierColors[tier] || tierColors.Newbie
  const trustScore = profile.trust_score || 50
  const trustProgress = Math.min(100, trustScore)

  const avatarLetter = profile.username?.replace('@', '').charAt(0).toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-10 bg-white border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/settings" className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors">
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-24 pb-12">

        {/* Profile card */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-5 shadow-sm">

          {/* Cover */}
          <div className="h-28 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 relative">
            <button className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs font-bold text-white hover:bg-white/30 transition-colors">
              <Edit3 className="w-3 h-3" /> Edit Profile
            </button>
          </div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 border-4 border-white flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
                  {avatarLetter}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white" />
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 ${tierColor.bg} border ${tierColor.border} rounded-full`}>
                <Star className="w-3.5 h-3.5 text-orange-400" />
                <span className={`text-xs font-extrabold ${tierColor.text}`}>{tier}</span>
              </div>
            </div>

            {/* Name and username */}
            <div className="mb-4">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{profile.username}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {profile.city && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {profile.city}{profile.state ? `, ${profile.state}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  Joined {new Date(profile.created_at || '2025-01-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { label: 'Events', value: profile.events_attended || 0 },
                { label: 'Groups', value: profile.fresh_groups_count || 0 },
                { label: 'Trust', value: trustScore },
                { label: 'Chemistry', value: profile.chemistry_score || 0 },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 bg-gray-50 rounded-2xl">
                  <div className="text-lg font-extrabold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 font-medium">{label}</div>
                </div>
              ))}
            </div>

            {/* Trust score bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-orange-500" /> Trust Score
                </span>
                <span className="text-xs font-extrabold text-orange-500">{trustScore} / 100</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                  style={{ width: `${trustProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-400">Newbie</span>
                <span className="text-xs text-gray-400">Legendary</span>
              </div>
            </div>

            {/* Interests */}
            {profile.user_interests && profile.user_interests.length > 0 && (
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Interests</div>
                <div className="flex flex-wrap gap-2">
                  {profile.user_interests.slice(0, 8).map((interest: { interest: string }) => (
                    <span key={interest.interest} className="px-3 py-1 bg-orange-50 border border-orange-100 text-orange-600 text-xs font-semibold rounded-full">
                      {interest.interest}
                    </span>
                  ))}
                  {profile.user_interests.length > 8 && (
                    <span className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-500 text-xs font-semibold rounded-full">
                      +{profile.user_interests.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Upcoming tickets */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-gray-900">Upcoming Events</h2>
              <Link href="/tickets" className="text-xs font-bold text-orange-500 hover:underline">View all →</Link>
            </div>
            {tickets && tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.map((ticket: {
                  id: string
                  ticket_code: string
                  events: { title: string, event_date: string, venue_name: string, city: string }
                }) => (
                  <div key={ticket.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {ticket.events?.title?.charAt(0) || 'E'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{ticket.events?.title}</div>
                      <div className="text-xs text-gray-500">
                        {ticket.events?.event_date
                          ? new Date(ticket.events.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                          : ''}
                      </div>
                    </div>
                    <Ticket className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Ticket className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 mb-3">No upcoming events</p>
                <Link href="/events" className="text-xs font-bold text-orange-500 hover:underline">
                  Browse events →
                </Link>
              </div>
            )}
          </div>

          {/* Trust score history */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-gray-900">Trust Activity</h2>
              <Link href="/dashboard/trust" className="text-xs font-bold text-orange-500 hover:underline">View all →</Link>
            </div>
            {trustHistory && trustHistory.length > 0 ? (
              <div className="space-y-3">
                {trustHistory.map((item: {
                  id: string
                  reason: string
                  points: number
                  created_at: string
                }) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.points > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <span className={`text-xs font-extrabold ${item.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {item.points > 0 ? '+' : ''}{item.points}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-700 truncate">{item.reason}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No trust activity yet</p>
                <p className="text-xs text-gray-400 mt-1">Attend events to earn trust points</p>
              </div>
            )}
          </div>

        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-100 mt-5">
          {[
            { icon: Ticket, label: 'My Tickets', href: '/tickets', desc: 'View all your tickets' },
            { icon: Users, label: 'My Groups', href: '/dashboard/groups', desc: 'Groups you have joined' },
            { icon: Star, label: 'Trust Score', href: '/dashboard/trust', desc: 'See how you earn trust' },
            { icon: Bell, label: 'Notifications', href: '/notifications', desc: 'Your alerts and updates' },
            { icon: Settings, label: 'Settings', href: '/dashboard/settings', desc: 'Account and preferences' },
          ].map(({ icon: Icon, label, href, desc }, i, arr) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-900">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          ))}
        </div>

        {/* Log out */}
        <form action="/auth/signout" method="POST" className="mt-4">
          <button className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-2xl hover:border-red-200 hover:text-red-500 transition-all">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </form>

      </div>
    </div>
  )
}