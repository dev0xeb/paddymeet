import SupportChat from '@/components/SupportChat'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Gift,
  Users,
  Copy,
  Share2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Award,
  Ticket,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'
import UserAvatarMenu from '@/components/UserAvatarMenu'
import ReferralCopyButton from '@/components/ReferralCopyButton'
import NotificationsBell from '@/components/NotificationsBell'

export default async function ReferralsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch current user profile
  let { data: profile } = await supabase
    .from('users')
    .select('id, username, full_name, tier, trust_score, referral_code, referral_points, referral_discount_percent')
    .eq('id', user.id)
    .single()

  // If referral_code doesn't exist, generate and persist one
  let referralCode = profile?.referral_code
  if (!referralCode && user) {
    const rawUsername = (profile?.username || 'PADDY').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    referralCode = `PADDY-${rawUsername}-${randomSuffix}`

    await supabase
      .from('users')
      .update({ referral_code: referralCode })
      .eq('id', user.id)
  }

  // Fetch live tracked list of referred users
  const { data: referredUsers } = await supabase
    .from('users')
    .select('id, username, full_name, created_at, tier, trust_score')
    .eq('referred_by', user.id)
    .order('created_at', { ascending: false })

  const referralsList = referredUsers || []
  const totalReferred = referralsList.length
  const totalPoints = profile?.referral_points || (totalReferred * 10)
  const discountPercent = profile?.referral_discount_percent || (totalReferred >= 5 ? 20 : totalReferred >= 1 ? 10 : 0)

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased text-slate-900">

      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <Link href="/" className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
            paddy<span className="text-orange-600">meet</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/events"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200/60"
          >
            <Ticket className="w-3.5 h-3.5" /> Find Events
          </Link>
          <NotificationsBell />
          <UserAvatarMenu username={profile?.username || ''} tier={profile?.tier || 'Newbie'} />
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Referrals & Squad Rewards
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
              <Gift className="w-3.5 h-3.5 text-orange-600" /> Active Rewards
            </span>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Invite your party crew to PaddyMeet. Earn bonus reward points, ticket discounts, and VIP upgrades.
          </p>
        </div>

        {/* Referral Code Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 mb-8 border border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 mb-3">
                <Gift className="w-3.5 h-3.5" /> 10 Points Per Friend Signup
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">
                Your Unique Invite Link
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                Share this link or code with your friends. They get a welcome reward, and you get instant points when they join.
              </p>
            </div>

            <div className="flex flex-col items-stretch sm:items-end gap-3 flex-shrink-0">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="text-[10px] text-slate-300 uppercase font-semibold">Your Referral Code</div>
                <div className="text-lg font-mono font-extrabold text-orange-400 tracking-wider">
                  {referralCode}
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <ReferralCopyButton referralCode={referralCode || 'PADDYMEET'} />
              </div>
            </div>

          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Friends</span>
              <Users className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{totalReferred}</div>
            <div className="text-[11px] text-slate-500 mt-1">Verified registrations</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reward Points</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{totalPoints}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">+10 pts per signup</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket Discount</span>
              <Award className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{discountPercent}% Off</div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">Auto-applied at checkout</div>
          </div>

        </div>

        {/* Live Tracked Referrals Ledger */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Tracked Referrals Ledger</h3>
              <p className="text-xs text-slate-500">Live list of users who signed up with your code</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
              {totalReferred} {totalReferred === 1 ? 'Friend' : 'Friends'} Tracked
            </span>
          </div>

          {referralsList.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {referralsList.map((refUser) => {
                const joinedDate = refUser.created_at
                  ? new Date(refUser.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Recently'

                return (
                  <div key={refUser.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {refUser.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {refUser.full_name || refUser.username}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          @{refUser.username} • Joined {joinedDate}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-extrabold text-emerald-600">+10 Points</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{refUser.tier || 'Newbie'} Tier</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">No Friends Referred Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Share your referral link above on WhatsApp or Twitter to invite your crew and start collecting discount rewards.
              </p>
            </div>
          )}
        </div>

        {/* Reward Tiers Roadmap */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] p-6 sm:p-8">
          <h3 className="text-base font-extrabold text-slate-900 mb-1">Squad Reward Tiers</h3>
          <p className="text-xs text-slate-500 mb-6">Unlock higher milestone perks as your party circle grows</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50">
              <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Tier 1: Starter</div>
              <div className="text-sm font-extrabold text-slate-900 mb-1">1–4 Friends</div>
              <p className="text-xs text-slate-500">10 points per signup + 10% discount on standard passes.</p>
            </div>

            <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50/30">
              <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Tier 2: Party Host</div>
              <div className="text-sm font-extrabold text-slate-900 mb-1">5–9 Friends</div>
              <p className="text-xs text-slate-500">20% discount on all passes + Free welcome drink voucher.</p>
            </div>

            <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30">
              <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Tier 3: Nightlife Legend</div>
              <div className="text-sm font-extrabold text-slate-900 mb-1">10+ Friends</div>
              <p className="text-xs text-slate-500">Free VIP Table pass + Priority fast-track gate entry.</p>
            </div>

          </div>
        </div>

      </main>

      <SupportChat accountType="explorer" />
    </div>
  )
}
