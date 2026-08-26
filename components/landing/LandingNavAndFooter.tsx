'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Zap,
  Radio,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Compass,
  CreditCard,
  Users,
  HelpCircle,
  ChevronRight
} from 'lucide-react'
import UserAvatarMenu from '@/components/UserAvatarMenu'

interface Props {
  user: any
  profile: any
}

export function LandingNavbar({ user, profile }: Props) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-6xl rounded-full px-4 sm:px-6 py-2.5 bg-[#0F141E]/80 backdrop-blur-2xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex items-center justify-between pointer-events-auto transition-all">
        
        {/* Left: Glowing Logotype with Lightning Glyph */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF5B1E] to-[#FF7B47] flex items-center justify-center text-white shadow-md shadow-[#FF5B1E]/30 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="text-lg font-extrabold text-white tracking-tight">
            paddy<span className="text-[#FF5B1E]">meet</span>
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <Link href="/events" className="hover:text-white transition-colors">
            Live Events
          </Link>
          <a href="#never-party-alone" className="hover:text-white transition-colors">
            Never Party Alone
          </a>
          <a href="#pay-and-share" className="hover:text-white transition-colors">
            Pay & Share
          </a>
          <Link href="/for-organisers" className="hover:text-[#FF5B1E] transition-colors">
            For Organisers
          </Link>
        </div>

        {/* Right: Live Pulse Activity Badge & CTA */}
        <div className="flex items-center gap-3">
          
          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>218 Squads Active in Lagos & Abuja</span>
          </div>

          {user && profile ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                Dashboard
              </Link>
              <UserAvatarMenu username={profile.username} tier={profile.tier || 'Newbie'} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 bg-gradient-to-r from-[#FF5B1E] to-[#FF6D3B] hover:from-[#FF4E0D] hover:to-[#FF5B1E] text-white text-xs font-bold rounded-full shadow-md shadow-[#FF5B1E]/30 transition-all active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}

        </div>

      </div>
    </nav>
  )
}

export function LandingFooterCTA() {
  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[#070A0F] overflow-hidden text-center">
      
      {/* Massive Glowing Neon Backdrop Banner */}
      <div className="max-w-6xl mx-auto rounded-[40px] p-8 sm:p-16 bg-gradient-to-b from-[#161D2B] via-[#0F141E] to-[#070A0F] border border-[#FF5B1E]/30 shadow-[0_20px_80px_-20px_rgba(255,91,30,0.3)] relative overflow-hidden space-y-8">
        
        {/* Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF5B1E]/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-[#FF5B1E] uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> High-Voltage Nightlife Access
          </div>

          <h2 className="text-3xl sm:text-6xl font-extrabold text-white uppercase tracking-tight leading-tight">
            Your Next Unforgettable Night Is One Click Away.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-normal">
            Join thousands of nightlife explorers across Lagos and Abuja. Lock in your tickets, split VIP tables with friends, and discover where the party is tonight.
          </p>
        </div>

        {/* Dual Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/events"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#FF5B1E] via-[#FF6D3B] to-[#FF5B1E] hover:from-[#FF4E0D] hover:to-[#FF5B1E] text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#FF5B1E]/30 active:scale-95 transition-all"
          >
            <span>Explore Live Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/for-organisers"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-[#FF5B1E]" />
            <span>Create & Host an Event</span>
          </Link>
        </div>

      </div>

      {/* Cyber Footer */}
      <footer className="max-w-7xl mx-auto mt-24 pt-12 border-t border-white/10 text-left text-xs text-slate-400 space-y-12">
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Col 1: Brand & Status */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF5B1E] flex items-center justify-center text-white">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">
                paddy<span className="text-[#FF5B1E]">meet</span>
              </span>
            </Link>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              The next-generation nightlife and social ticketing platform for Nigeria. Discover concerts, split table costs, and party safely with verified squads.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 text-emerald-400 border border-[#10B981]/20 font-mono text-[10px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Systems Operational (Lagos & Abuja)
            </div>
          </div>

          {/* Col 2: Discover */}
          <div className="space-y-3">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">Discover</div>
            <ul className="space-y-2">
              <li><Link href="/events" className="hover:text-white transition-colors">Concerts & Raves</Link></li>
              <li><Link href="/events?city=lagos" className="hover:text-white transition-colors">Lagos Nightlife</Link></li>
              <li><Link href="/events?city=abuja" className="hover:text-white transition-colors">Abuja Events</Link></li>
              <li><Link href="/events?vibe=Chill" className="hover:text-white transition-colors">Rooftop Lounges</Link></li>
            </ul>
          </div>

          {/* Col 3: Organisers */}
          <div className="space-y-3">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">Organisers</div>
            <ul className="space-y-2">
              <li><Link href="/for-organisers" className="hover:text-white transition-colors">Host Portal</Link></li>
              <li><Link href="/scan" className="hover:text-white transition-colors">Gatekeeper Scanner</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Apply as Host</Link></li>
              <li><Link href="/organiser/dashboard/payouts" className="hover:text-white transition-colors">Paystack Payouts</Link></li>
            </ul>
          </div>

          {/* Col 4: Trust & Safety */}
          <div className="space-y-3">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">Trust & Safety</div>
            <ul className="space-y-2">
              <li><Link href="/trust-and-safety" className="hover:text-white transition-colors">Trust Score Rules</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white transition-colors">48-Hr Refund Policy</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Credits & Social SVG Links */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} PaddyMeet Inc. All rights reserved. Built for West African Nightlife.
          </div>

          {/* Clean Vector SVG Social Icons (Zero emojis) */}
          <div className="flex items-center gap-4 text-slate-400">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
              <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="X (Twitter)">
              <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="TikTok">
              <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>
            </a>
          </div>
        </div>

      </footer>

    </section>
  )
}
