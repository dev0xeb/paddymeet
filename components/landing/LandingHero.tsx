'use client'

import { useState, useRef, MouseEvent } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  MapPin,
  Flame,
  Users,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Calendar,
  Clock,
  CheckCircle2,
  Zap
} from 'lucide-react'

interface LiveEventItem {
  id: string
  title: string
  event_type: string
  city: string
  event_date: string
  vibe?: string
  start_time?: string
  venue_name?: string
}

interface Props {
  featuredEvents: LiveEventItem[]
}

export default function LandingHero({ featuredEvents }: Props) {
  const [city, setCity] = useState('lagos')
  const [vibe, setVibe] = useState('Rave')
  const [groupType, setGroupType] = useState('social')
  const [rotate, setRotate] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setRotate({
      x: -(y / rect.height) * 16,
      y: (x / rect.width) * 16,
    })
  }

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 })
  }

  const topEvent = featuredEvents[0] || {
    id: 'demo-event',
    title: 'Lagos Midnight Odyssey',
    event_type: 'Rave',
    city: 'Lagos Island',
    event_date: '2026-10-02',
    vibe: 'Turnt',
    venue_name: 'The Obsidian Dome',
  }

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#070A0F]">
      
      {/* Dynamic Radial Ambient Lighting Orbs */}
      <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-[#FF5B1E]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[550px] h-[550px] bg-[#8B5CF6]/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* Left Column: Typography & Quick Matcher Bar */}
        <div className="lg:col-span-7 space-y-8 text-left">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#121826]/80 border border-white/10 backdrop-blur-xl shadow-lg shadow-black/40">
            <div className="w-5 h-5 rounded-full bg-[#FF5B1E]/20 flex items-center justify-center text-[#FF5B1E]">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              The Next-Gen Nightlife & Social Ticketing Platform
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white uppercase leading-[1.05]">
              Don&apos;t Just Buy A Ticket.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5B1E] via-[#FBBF24] to-[#FF5B1E]">
                Find Your Crew.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-xl font-normal leading-relaxed pt-2">
              Discover Lagos and Abuja’s hottest concerts, raves, and beach festivals. Form private squads, split ticket costs instantly, and arrive together with verified safety.
            </p>
          </div>

          {/* Interactive Quick Crew Matcher Bar */}
          <div className="p-3 sm:p-4 rounded-3xl bg-[#0F141E]/90 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* City Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#FF5B1E]" /> Location
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  aria-label="Filter by Location"
                  className="w-full px-3 py-2.5 bg-[#161D2B] border border-white/10 rounded-xl text-xs font-semibold text-white outline-none focus:border-[#FF5B1E] transition-all cursor-pointer"
                >
                  <option value="lagos">Lagos (VI, Lekki, Ikeja)</option>
                  <option value="abuja">Abuja (Maitama, Wuse)</option>
                  <option value="all">All Cities</option>
                </select>
              </div>

              {/* Vibe Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[#FBBF24]" /> Energy / Vibe
                </label>
                <select
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  aria-label="Filter by Energy Vibe"
                  className="w-full px-3 py-2.5 bg-[#161D2B] border border-white/10 rounded-xl text-xs font-semibold text-white outline-none focus:border-[#FF5B1E] transition-all cursor-pointer"
                >
                  <option value="Rave">Underground Rave</option>
                  <option value="Afrobeats">Afrobeats & Live</option>
                  <option value="Turnt">Turnt High Energy</option>
                  <option value="Chill">Rooftop & Lounge</option>
                  <option value="Festival">Beach & Day Festival</option>
                </select>
              </div>

              {/* Group Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#8B5CF6]" /> Squad Setup
                </label>
                <select
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                  aria-label="Filter by Squad Setup"
                  className="w-full px-3 py-2.5 bg-[#161D2B] border border-white/10 rounded-xl text-xs font-semibold text-white outline-none focus:border-[#FF5B1E] transition-all cursor-pointer"
                >
                  <option value="social">Open Social Crew</option>
                  <option value="table">VIP Table Split (Pay & Share)</option>
                  <option value="solo">Solo Ticket</option>
                </select>
              </div>

            </div>

            {/* Submit Action */}
            <Link
              href={`/events?city=${encodeURIComponent(city)}&vibe=${encodeURIComponent(vibe)}`}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FF5B1E] via-[#FF6D3B] to-[#FF5B1E] hover:from-[#FF4E0D] hover:to-[#FF5B1E] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#FF5B1E]/30 active:scale-[0.99] transition-all"
            >
              <span>Find My Squad & Explore Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/10 text-left">
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">218+</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Active Squads Forming</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">₦0</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Split Debt Risk</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">100%</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Verified Gate Entry</div>
            </div>
          </div>

        </div>

        {/* Right Column: 3D Holographic VIP Pass Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end [perspective:1200px]">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
              transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.4, 1)',
            }}
            className="relative w-full max-w-[380px] rounded-3xl p-6 bg-gradient-to-b from-[#161D2B]/90 via-[#0F141E]/95 to-[#070A0F] border border-white/15 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(255,91,30,0.3)] select-none cursor-pointer group"
          >
            {/* Holographic Iridescent Shimmer */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/5 to-[#FF5B1E]/10 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

            {/* Top Pass Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF5B1E] to-[#8B5CF6] flex items-center justify-center text-white">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white uppercase tracking-wider">PADDYMEET PASS</div>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ENCRYPTED VIP
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#FF5B1E]/20 text-[#FF5B1E] border border-[#FF5B1E]/30">
                PAY & SHARE READY
              </span>
            </div>

            {/* Event Info */}
            <div className="py-5 space-y-3">
              <div className="h-32 rounded-2xl bg-gradient-to-br from-[#1F293D] via-[#121826] to-[#0A0D14] border border-white/10 relative overflow-hidden flex flex-col justify-end p-4">
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 backdrop-blur-md text-white border border-white/15">
                  {topEvent.event_type || 'Rave'}
                </div>
                <div className="text-xs font-bold text-[#FF5B1E] uppercase tracking-wider">Live Event Spotlight</div>
                <div className="text-base font-extrabold text-white truncate">{topEvent.title}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#FF5B1E]" /> Date
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {topEvent.event_date ? new Date(topEvent.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#FF5B1E]" /> City
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5 truncate">{topEvent.city}</div>
                </div>
              </div>
            </div>

            {/* Live QR Pass Watermark */}
            <div className="pt-4 border-t border-dashed border-white/15 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Pass Key Hash</div>
                <div className="text-xs font-mono font-extrabold text-white tracking-widest mt-0.5">
                  PDM-8824-VIP
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> One-Time Scan Valid
                </div>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg">
                <QrCode className="w-full h-full text-slate-900" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
