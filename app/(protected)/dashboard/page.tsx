import NotificationsBell from '@/components/NotificationsBell'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Users, ChevronRight, Shield } from 'lucide-react'
import UserAvatarMenu from '@/components/UserAvatarMenu'
import SupportChat from '@/components/SupportChat'
import OpenGroupButton from '@/components/OpenGroupButton'
import ReferralCopyButton from '@/components/ReferralCopyButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: tickets },
    { data: groupMembers },
  ] = await Promise.all([
    supabase.from('users').select('*, user_interests(*)').eq('id', user.id).single(),
    supabase.from('tickets').select('*, events(*)').eq('user_id', user.id).eq('status', 'active').order('purchased_at', { ascending: false }).limit(3),
    supabase.from('group_members').select('*, groups(*, events(title, event_date, city))').eq('user_id', user.id).limit(3),
  ])

  if (!profile) redirect('/login')

  const tierColors: Record<string, string> = {
    Newbie: 'bg-gray-100 text-gray-600',
    Social: 'bg-green-50 text-green-600',
    Crew: 'bg-blue-50 text-blue-600',
    Elite: 'bg-purple-50 text-purple-600',
    Legendary: 'bg-orange-50 text-orange-600',
  }

  const tierProgress: Record<string, number> = {
    Newbie: 25, Social: 50, Crew: 68, Elite: 85, Legendary: 100
  }

  const tier = profile.tier || 'Newbie'
  const progress = tierProgress[tier] || 25

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/events" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden md:block">
            Browse Events
          </Link>
          <NotificationsBell />
          <UserAvatarMenu username={profile.username} tier={tier} />
        </div>
      </nav>

      <div className="pt-16 max-w-6xl mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pt-8 pb-6 md:pt-10 md:pb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
              Good Day, {profile.full_name?.split(' ')[0] || profile.username} 👋
            </h1>
            <p className="text-sm text-gray-500">Here is what is happening with your events and groups</p>
          </div>
          <Link href="/events" className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
            Find Events <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            { label: 'Events attended', value: profile.events_attended || 0, color: 'orange' },
            { label: 'Trust score', value: profile.trust_score || 50, color: 'blue' },
            { label: 'Fresh crews', value: profile.fresh_groups_count || 0, color: 'green' },
            { label: 'Chemistry score', value: profile.chemistry_score || 0, color: 'purple' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
              <div className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">{value}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">

          {/* Left column — spans 2 */}
          <div className="lg:col-span-2 space-y-5 md:space-y-6">

            {/* Upcoming events */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-extrabold text-gray-900">Upcoming Events</h2>
                <Link href="/tickets" className="text-xs font-bold text-orange-500 hover:underline">View all →</Link>
              </div>
              {tickets && tickets.length > 0 ? (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {ticket.events?.title?.charAt(0) || 'E'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{ticket.events?.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{ticket.events?.city || '—'}</div>
                      </div>
                      <div className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full">Active</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                    <Calendar className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-400 mb-1">No upcoming events</p>
                  <p className="text-xs text-gray-400 mb-4">Discover events near you and get your tickets</p>
                  <Link href="/events" className="text-xs font-bold text-orange-500 hover:underline">Browse events →</Link>
                </div>
              )}
            </div>

            {/* My Groups */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-extrabold text-gray-900">My Groups</h2>
              </div>
              {groupMembers && groupMembers.length > 0 ? (
                <div className="space-y-3">
                  {groupMembers.map((member) => {
                    const group = Array.isArray(member.groups) ? member.groups[0] : member.groups
                    const eventTitle = Array.isArray(group?.events) ? group?.events[0]?.title : group?.events?.title
                    return (
                      <div key={member.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {group?.name?.charAt(0) || 'G'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate">{group?.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5 truncate">{eventTitle || '—'}</div>
                          </div>
                        </div>
                        {group && (
                          <OpenGroupButton
                            groupId={group.id}
                            groupName={group.name}
                            eventTitle={eventTitle || group.name}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                    <Users className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-400 mb-1">No groups yet</p>
                  <p className="text-xs text-gray-400 mb-4">Join a group at an event to start coordinating</p>
                  <Link href="/events" className="text-xs font-bold text-orange-500 hover:underline">Find events →</Link>
                </div>
              )}
            </div>

          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Profile card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                  {profile.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-gray-900">{profile.username}</div>
                  <div className="text-xs text-gray-500">{profile.city}{profile.state ? `, ${profile.state}` : ''}</div>
                </div>
                <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${tierColors[tier]}`}>{tier}</span>
              </div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-orange-400" /> Trust Score
                </span>
                <span className="text-xs font-bold text-orange-500">{profile.trust_score || 50} / 100</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              {profile.user_interests && profile.user_interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.user_interests.slice(0, 5).map((i: { interest: string }) => (
                    <span key={i.interest} className="px-2.5 py-1 bg-orange-50 border border-orange-100 text-orange-600 text-xs font-semibold rounded-full">
                      {i.interest}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Wallet */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="text-sm font-extrabold text-gray-900 mb-4">Wallet & Rewards</h2>
              <div className="text-center py-3 border-b border-gray-100 mb-4">
                <div className="text-xs text-gray-500 mb-1 uppercase font-semibold tracking-wider">Profile Balance</div>
                <div className="text-2xl font-extrabold text-gray-900">₦{(profile.profile_balance || 0).toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Discount codes', value: '0 active' },
                  { label: 'Airtime earned', value: '₦0' },
                  { label: 'Referrals', value: '0 total' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs font-bold text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>

{/* Referral */}
<div className="bg-orange-500 rounded-2xl p-5">
  <h2 className="text-sm font-extrabold text-white mb-1">Invite friends</h2>
  <p className="text-xs text-orange-100 mb-4 leading-relaxed">Earn points and rewards for every friend who joins Paddymeet.</p>

  <div className="grid grid-cols-2 gap-2 mb-3">
    <div className="bg-white bg-opacity-15 rounded-xl px-3 py-2.5 text-center">
      <div className="text-lg font-extrabold text-white">{profile.referral_points || 0}</div>
      <div className="text-xs text-orange-100">Points earned</div>
    </div>
    <div className="bg-white bg-opacity-15 rounded-xl px-3 py-2.5 text-center">
      <div className="text-lg font-extrabold text-white">{profile.referral_discount_percent || 0}%</div>
      <div className="text-xs text-orange-100">Discount ready</div>
    </div>
  </div>

  <div className="bg-white bg-opacity-20 rounded-xl px-3 py-2.5 flex items-center justify-between mb-3">
    <span className="text-xs font-mono text-white truncate">{profile.referral_code || 'LOADING...'}</span>
    <ReferralCopyButton code={profile.referral_code} />
  </div>
</div>

          </div>
        </div>
      </div>

      <SupportChat accountType="explorer" />
    </div>
  )
}