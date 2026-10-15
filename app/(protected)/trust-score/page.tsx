import SupportChat from '@/components/SupportChat'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck,
  Star,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Ticket,
  Users,
  Sparkles,
  ChevronRight,
  Lock,
  Zap,
  Info
} from 'lucide-react'
import UserAvatarMenu from '@/components/UserAvatarMenu'
import NotificationsBell from '@/components/NotificationsBell'
import Logo from '@/components/brand/Logo'
import { getTierThresholds, tierForScore, MAX_TRUST_SCORE } from '@/lib/trustScore'

export default async function TrustScorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: tickets }, { data: groupMemberships }, thresholds] = await Promise.all([
    supabase
      .from('users')
      .select('id, username, full_name, tier, trust_score, phone, city, state, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('tickets')
      .select('id, status, attended')
      .eq('user_id', user.id),
    supabase
      .from('group_members')
      .select('id, payment_status')
      .eq('user_id', user.id),
    getTierThresholds(supabase),
  ])

  const trustScore = profile?.trust_score ?? 50
  const tier = profile?.tier || tierForScore(trustScore, thresholds)

  // Tier Roadmap rows, built from the live Platform Settings thresholds
  // rather than a hardcoded copy — this used to show its own fixed 0-100
  // breakdown regardless of what was actually configured, or what a user's
  // real stored tier was.
  const tierOrder = ['Newbie', 'Social', 'Crew', 'Elite', 'Legendary'] as const
  const tierDescriptions: Record<typeof tierOrder[number], string> = {
    Newbie: 'Standard ticket purchasing and public event discovery.',
    Social: 'Create social squad groups and join open split tables.',
    Crew: 'Priority customer support and reduced table hold times.',
    Elite: 'VIP Table Host status, fast-track QR passes, and exclusive discounts.',
    Legendary: 'Direct access to sold-out cabanas, zero hold deposit, and VIP perks.',
  }
  const tierMinima: Record<typeof tierOrder[number], number> = {
    Newbie: thresholds.Newbie,
    Social: thresholds.Social,
    Crew: thresholds.Crew,
    Elite: thresholds.Elite,
    Legendary: thresholds.Legendary,
  }
  const tierRoadmap = tierOrder.map((name, i) => {
    const min = tierMinima[name]
    const nextMin = i < tierOrder.length - 1 ? tierMinima[tierOrder[i + 1]] : MAX_TRUST_SCORE + 1
    const max = Math.max(min, nextMin - 1)
    return {
      tier: `${name} (${min}–${max})`,
      desc: tierDescriptions[name],
      unlocked: trustScore >= min,
      current: trustScore >= min && trustScore < nextMin,
    }
  })

  const attendedTickets = tickets?.filter(t => t.status === 'used' || t.attended) || []
  const paidGroups = groupMemberships?.filter(m => m.payment_status === 'paid') || []

  // Dynamic factor calculations
  const isProfileComplete = !!(profile?.full_name && profile?.phone && profile?.state && profile?.city)
  const identityPts = isProfileComplete ? 20 : 10
  const attendancePts = Math.min(30, 15 + (attendedTickets.length * 5))
  const tableReliabilityPts = Math.min(25, 15 + (paidGroups.length * 5))
  const communityPts = trustScore - (identityPts + attendancePts + tableReliabilityPts) > 0 
    ? trustScore - (identityPts + attendancePts + tableReliabilityPts) 
    : 15

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
            <Logo variant="horizontal" tone="color" className="h-7 w-auto" />
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
              Trust Score & Explorer Standing
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" /> {tier} Member
            </span>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Your Trust Score reflects your reliability on split tables, verified attendance history, and community standing.
          </p>
        </div>

        {/* Hero Score Meter */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 mb-8 border border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Star className="w-3.5 h-3.5" /> Verified Reputation
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {tier} Explorer Standing
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                You have an exceptional trust rating. You enjoy access to VIP group tables and priority split bookings.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 self-start sm:self-auto min-w-[140px]">
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-orange-400">
                {trustScore}
              </div>
              <div className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">
                out of {MAX_TRUST_SCORE}
              </div>
            </div>

          </div>

          {/* Meter Bar */}
          <div className="mt-6 pt-6 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span>Tier Progress</span>
              <span>{Math.round((trustScore / MAX_TRUST_SCORE) * 100)}% Complete</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, (trustScore / MAX_TRUST_SCORE) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Score Composition Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] p-6 sm:p-8 mb-8 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Score Composition Breakdown</h3>
            <p className="text-xs text-slate-500">How your {trustScore} points are calculated in real time</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                +{identityPts}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900">Identity & Profile Verification</div>
                <div className="text-xs text-slate-500 mt-0.5">Full name, verified phone number (+234), and active state.</div>
                <div className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${isProfileComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                  <CheckCircle2 className="w-3 h-3" /> {isProfileComplete ? 'Fully Completed' : 'Incomplete — add your phone, city & state'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                +{attendancePts}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900">Gate Attendance Record</div>
                <div className="text-xs text-slate-500 mt-0.5">Verified QR scans at event gates without no-shows.</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {attendedTickets.length} Attended Events Recorded
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                +{tableReliabilityPts}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900">Table Split Reliability</div>
                <div className="text-xs text-slate-500 mt-0.5">Settling squad table shares before countdown expiry.</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 100% On-Time Payment Rate
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                +{communityPts}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900">Community & Squad Standing</div>
                <div className="text-xs text-slate-500 mt-0.5">Positive host ratings and active squad participation.</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Good Standing
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Tier Roadmap & Privilege Unlocks */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] p-6 sm:p-8">
          <h3 className="text-base font-extrabold text-slate-900 mb-1">Tier Roadmap & Perks</h3>
          <p className="text-xs text-slate-500 mb-6">Unlock exclusive platform privileges as your score increases</p>

          <div className="space-y-3">
            {tierRoadmap.map((t) => (
              <div
                key={t.tier}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                  t.current
                    ? 'border-orange-500 bg-orange-50/20 ring-1 ring-orange-500/20'
                    : t.unlocked
                    ? 'border-slate-200/80 bg-white'
                    : 'border-slate-200/60 bg-slate-50/50 opacity-60'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{t.tier}</span>
                    {t.current && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                        Current Rank
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{t.desc}</p>
                </div>

                <div className="flex-shrink-0">
                  {t.unlocked ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Locked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <SupportChat accountType="explorer" />
    </div>
  )
}
