import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Ticket, Users, Gift, ChevronRight, Bell, Shield } from 'lucide-react'
import UserAvatarMenu from '@/components/UserAvatarMenu'
import SupportChat from '@/components/SupportChat'
import OpenGroupButton from '@/components/OpenGroupButton'

export default async function DashboardPage() {
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
    .select('*, events(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('purchased_at', { ascending: false })
    .limit(5)

  const { data: groupMembers } = await supabase
    .from('group_members')
    .select('*, groups(*, events(title, event_date))')
    .eq('user_id', user.id)
    .limit(5)

  const tier = profile.tier || 'Newbie'
  const tierProgress: Record<string, number> = {
    Newbie: 25, Social: 50, Crew: 68, Elite: 85, Legendary: 100
  }
  const progress = tierProgress[tier] || 25

  const tierLabel: Record<string, string> = {
    Newbie: 'Keep attending events to level up',
    Social: 'Join more groups to reach Crew',
    Crew: 'You are building a great reputation',
    Elite: 'Almost at the top — keep going',
    Legendary: 'You have reached the highest tier',
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-10 bg-white border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/events" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
            Browse Events
          </Link>
          <button className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors relative">
            <Bell className="w-4 h-4" />
          </button>
          <UserAvatarMenu username={profile.username} tier={tier} />
        </div>
      </nav>

      <div className="pt-16 max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-5">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Hey {profile.full_name?.split(' ')[0] || profile.username} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here is what is happening with your events</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Events attended', value: profile.events_attended || 0 },
            { label: 'Groups joined', value: profile.fresh_groups_count || 0 },
            { label: 'Trust score', value: profile.trust_score || 50 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
              <div className="text-2xl font-extrabold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Upcoming tickets */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-gray-900">Upcoming Events</h2>
            <Link href="/tickets" className="text-xs font-bold text-orange-500 hover:underline">View all →</Link>
          </div>
          {tickets && tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {ticket.events?.title?.charAt(0) || 'E'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{ticket.events?.title}</div>
                    <div className="text-xs text-gray-500">{ticket.events?.city}</div>
                  </div>
                  <Link href="/tickets" className="text-xs font-bold text-orange-500 flex-shrink-0">
                    <Ticket className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-3">No upcoming events</p>
              <Link href="/events" className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-full hover:bg-orange-600 transition-colors">
                Browse Events <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* My Groups */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5" id="groups">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-gray-900">My Groups</h2>
          </div>
          {groupMembers && groupMembers.length > 0 ? (
            <div className="space-y-3">
              {groupMembers.map((member) => {
                const group = Array.isArray(member.groups) ? member.groups[0] : member.groups
                const eventTitle = Array.isArray(group?.events) ? group?.events[0]?.title : group?.events?.title
                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {group?.name?.charAt(0) || 'G'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{group?.name}</div>
                      <div className="text-xs text-gray-500 truncate">{eventTitle || '—'}</div>
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
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-3">No groups yet</p>
              <Link href="/events" className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-full hover:bg-orange-600 transition-colors">
                Find Events <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Trust Score */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5" id="trust">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-gray-900">Trust Score</h2>
            <span className="text-sm font-extrabold text-orange-500">{profile.trust_score || 50} / 100</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-400" />
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                tier === 'Legendary' ? 'bg-orange-50 text-orange-500' :
                tier === 'Elite' ? 'bg-purple-50 text-purple-500' :
                tier === 'Crew' ? 'bg-blue-50 text-blue-500' :
                tier === 'Social' ? 'bg-green-50 text-green-500' :
                'bg-gray-100 text-gray-500'
              }`}>{tier}</span>
            </div>
            <span className="text-xs text-gray-400">{tierLabel[tier]}</span>
          </div>

          {/* Interests */}
          {profile.user_interests && profile.user_interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
              {profile.user_interests.slice(0, 6).map((i: { interest: string }) => (
                <span key={i.interest} className="px-2.5 py-1 bg-orange-50 border border-orange-100 text-orange-600 text-xs font-semibold rounded-full">
                  {i.interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Wallet & Referrals */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5" id="referrals">
          <h2 className="text-sm font-extrabold text-gray-900 mb-4">Wallet & Referrals</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <div className="text-lg font-extrabold text-gray-900">₦{(profile.profile_balance || 0).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-0.5">Profile balance</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <div className="text-lg font-extrabold text-gray-900">0</div>
              <div className="text-xs text-gray-500 mt-0.5">Referrals</div>
            </div>
          </div>

          {/* Referral code */}
          <div className="bg-orange-500 rounded-xl p-4">
            <div className="text-xs font-bold text-orange-100 mb-1">Your referral code</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-extrabold text-white tracking-wider">
                {profile.referral_code || 'LOADING'}
              </span>
              <button className="px-3 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 transition-colors">
                Copy
              </button>
            </div>
            <div className="text-xs text-orange-100 mt-2">
              Share your code and earn rewards when friends join
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-extrabold text-gray-900 mb-3">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Browse Events', href: '/events', icon: Calendar },
              { label: 'My Tickets', href: '/tickets', icon: Ticket },
              { label: 'My Groups', href: '#groups', icon: Users },
              { label: 'Invite Friends', href: '#referrals', icon: Gift },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={label} href={href}
                className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50 transition-all">
                <Icon className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-700">{label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      <SupportChat accountType="explorer" />
    </div>
  )
}