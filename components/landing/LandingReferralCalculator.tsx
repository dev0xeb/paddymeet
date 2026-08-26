'use client'

import { useState } from 'react'
import {
  Gift,
  ShieldCheck,
  Star,
  Award,
  Users,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function LandingReferralCalculator() {
  const [friendsCount, setFriendsCount] = useState(5)

  // Dynamic calculations based on slider
  const pointsEarned = friendsCount * 10
  const discountPercent = friendsCount >= 10 ? 25 : friendsCount >= 5 ? 20 : 10
  const bonusReward =
    friendsCount >= 10
      ? '100% Free VIP Cabana Table Pass + Legendary Badge'
      : friendsCount >= 5
      ? '20% Discount on All Passes + Free Welcome Drink Voucher'
      : '10% Discount on Standard Passes + Verified Status'

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0F141E]/90 border-t border-b border-white/5 relative overflow-hidden text-left">
      
      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/3 w-[600px] h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161D2B] border border-white/10 text-xs font-semibold text-[#FBBF24] uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5 text-[#FBBF24]" /> Community Perks & Referral Engine
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase leading-tight">
            Bring Your Crew. Party For Free.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
            Every friend you bring into PaddyMeet earns you instant reward points, auto-applied ticket discounts, and fast-track VIP access across all partner venues.
          </p>
        </div>

        {/* 2-Column Grid: Referral Calculator + Tier Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Interactive Referral Slider Widget */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#121826]/90 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Interactive Referral Calculator
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FF5B1E]/20 text-[#FF5B1E] border border-[#FF5B1E]/30">
                +10 PTS / SIGNUP
              </span>
            </div>

            {/* Slider Control */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">
                  How many friends are you inviting?
                </span>
                <span className="text-2xl font-extrabold text-[#FF5B1E] font-mono">
                  {friendsCount} Friends
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="20"
                value={friendsCount}
                onChange={(e) => setFriendsCount(Number(e.target.value))}
                aria-label="Number of friends to invite"
                className="w-full h-2.5 bg-[#1F293D] rounded-lg appearance-none cursor-pointer accent-[#FF5B1E]"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 Friend</span>
                <span>10 Friends</span>
                <span>20 Friends</span>
              </div>
            </div>

            {/* Dynamic Calculated Output Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Reward Points</div>
                <div className="text-xl font-extrabold text-emerald-400">+{pointsEarned} Pts</div>
                <div className="text-[10px] text-slate-500">Credited instantly</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Ticket Discount</div>
                <div className="text-xl font-extrabold text-[#FBBF24]">{discountPercent}% OFF</div>
                <div className="text-[10px] text-slate-500">Auto-applied at Paystack</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Unlocked Perk</div>
                <div className="text-xs font-bold text-white leading-tight truncate">VIP Access</div>
                <div className="text-[10px] text-slate-500">Door Fast-Track</div>
              </div>
            </div>

            {/* Unlocked Summary Badge */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FF5B1E]/15 to-[#8B5CF6]/15 border border-[#FF5B1E]/30 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#FF5B1E] flex-shrink-0" />
              <div className="text-xs font-bold text-white">
                Calculated Perk: <span className="text-[#FBBF24]">{bonusReward}</span>
              </div>
            </div>

          </div>

          {/* Right Column: Community Trust Tier Gauge */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[#121826]/90 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-6">
            
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Reputation Standing
              </div>
              <h3 className="text-xl font-extrabold text-white">Community Trust Tiers</h3>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Newbie Explorer', pts: '0–49 Pts', desc: 'Standard ticket purchasing & open events.', active: true },
                { name: 'Social Crew Member', pts: '50–79 Pts', desc: 'Host social squads & join open split tables.', active: true },
                { name: 'Elite VIP Host', pts: '80–89 Pts', desc: 'Exclusive Cabana holds & priority entry.', active: true },
                { name: 'Party Legend', pts: '90–100 Pts', desc: 'Zero hold deposit & direct promoter backstage passes.', active: false },
              ].map((tier, idx) => (
                <div
                  key={tier.name}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    idx === 2
                      ? 'bg-[#FF5B1E]/15 border-[#FF5B1E]/40'
                      : tier.active
                      ? 'bg-white/[0.03] border-white/10'
                      : 'bg-white/[0.01] border-white/5 opacity-60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">{tier.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{tier.pts}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{tier.desc}</p>
                  </div>

                  {tier.active ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <span>Join As Explorer & Start Leveling Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

          </div>

        </div>

      </div>

    </section>
  )
}
