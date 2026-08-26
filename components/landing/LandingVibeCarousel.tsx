'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Compass,
  Music,
  Flame,
  Wine,
  Sun,
  Crown,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react'

interface EventItem {
  id: string
  title: string
  event_type: string
  city: string
  event_date: string
  vibe?: string
  start_time?: string
  venue_name?: string
  is_free?: boolean
}

interface Props {
  events: EventItem[]
}

const VIBE_PILLS = [
  { id: 'all', label: 'All Energies', icon: Sparkles },
  { id: 'Afrobeats', label: 'Afrobeats & Live', icon: Music },
  { id: 'Rave', label: 'Underground Raves', icon: Flame },
  { id: 'Chill', label: 'Rooftop Lounges', icon: Wine },
  { id: 'Festival', label: 'Beach & Day Parties', icon: Sun },
  { id: 'VIP Table', label: 'VIP Table Sharing', icon: Crown },
]

export default function LandingVibeCarousel({ events }: Props) {
  const [activeVibe, setActiveVibe] = useState('all')

  const fallbackEvents: EventItem[] = [
    {
      id: 'e1',
      title: 'Lagos Midnight Odyssey Rave',
      event_type: 'Rave',
      city: 'Lagos Island',
      event_date: '2026-10-02',
      vibe: 'Rave',
      venue_name: 'The Obsidian Dome',
    },
    {
      id: 'e2',
      title: 'All Night Amapiano & Afrobeats Bash',
      event_type: 'Concert',
      city: 'Ikeja, Lagos',
      event_date: '2026-09-23',
      vibe: 'Afrobeats',
      venue_name: 'Eko Grand Hall',
    },
    {
      id: 'e3',
      title: 'Skyline Sunset Rooftop Lounge',
      event_type: 'Party',
      city: 'Maitama, Abuja',
      event_date: '2026-10-15',
      vibe: 'Chill',
      venue_name: 'The Terrace Rooftop',
    },
    {
      id: 'e4',
      title: 'Tarkwa Bay Beach Day Festival',
      event_type: 'Festival',
      city: 'Victoria Island, Lagos',
      event_date: '2026-10-20',
      vibe: 'Festival',
      venue_name: 'Private Beach Shore',
    },
  ]

  const displayList = events && events.length > 0 ? events : fallbackEvents
  const filteredEvents =
    activeVibe === 'all'
      ? displayList
      : displayList.filter(
          (e) =>
            e.vibe?.toLowerCase().includes(activeVibe.toLowerCase()) ||
            e.event_type?.toLowerCase().includes(activeVibe.toLowerCase())
        )

  const carouselList = filteredEvents.length > 0 ? filteredEvents : displayList

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0F141E]/80 border-t border-b border-white/5 relative overflow-hidden">
      
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[#FF5B1E]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto mb-12 text-center space-y-4">
        
        {/* Subtitle Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161D2B] border border-white/10 text-xs font-semibold text-[#FF5B1E] uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" /> Curated by Energy, Not Just Dates
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
          Explore Trending Nights & Squad Drops
        </h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-normal">
          From high-voltage underground warehouses to exclusive rooftop lounges — pick your vibe and jump directly into active social tables.
        </p>

        {/* Vibe Pills Filter Bar */}
        <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
          {VIBE_PILLS.map((pill) => {
            const Icon = pill.icon
            const isSelected = activeVibe === pill.id
            return (
              <button
                key={pill.id}
                onClick={() => setActiveVibe(pill.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[#FF5B1E] text-white shadow-lg shadow-[#FF5B1E]/30 scale-105'
                    : 'bg-[#161D2B] text-slate-400 hover:text-white hover:bg-[#1F293D] border border-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{pill.label}</span>
              </button>
            )
          })}
        </div>

      </div>

      {/* Infinite Event Carousel Feed */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {carouselList.map((event, index) => {
            const formattedDate = event.event_date
              ? new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
              : 'TBD'

            return (
              <div
                key={`${event.id}-${index}`}
                className="group relative rounded-3xl bg-[#121826]/90 border border-white/10 hover:border-[#FF5B1E]/50 backdrop-blur-xl overflow-hidden shadow-xl hover:shadow-[0_20px_50px_-15px_rgba(255,91,30,0.2)] transition-all duration-300 flex flex-col justify-between"
              >
                {/* Event Card Header Graphic */}
                <div className="h-44 bg-gradient-to-br from-[#1F293D] via-[#121826] to-[#0A0D14] p-4 relative overflow-hidden flex flex-col justify-between">
                  
                  {/* Subtle Neon Shimmer on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F141E] to-transparent opacity-80" />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-black/50 backdrop-blur-md text-white border border-white/15">
                      {event.event_type || 'Nightlife'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FF5B1E]/20 text-[#FF5B1E] border border-[#FF5B1E]/30">
                      <ShieldCheck className="w-3 h-3" /> 10-Min Hold
                    </span>
                  </div>

                  <div className="relative z-10">
                    <span className="text-[10px] font-bold text-[#FBBF24] uppercase tracking-wider">
                      {event.vibe || 'Party'} Energy
                    </span>
                    <h3 className="text-base font-extrabold text-white truncate mt-0.5">
                      {event.title}
                    </h3>
                  </div>

                </div>

                {/* Event Body Details */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#FF5B1E] flex-shrink-0" />
                      <span className="text-white font-medium">{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#FF5B1E] flex-shrink-0" />
                      <span className="truncate">{event.venue_name || event.city}</span>
                    </div>
                  </div>

                  {/* Squad Formation Indicator */}
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <div className="w-6 h-6 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span>3 Squads Forming</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">LIVE CHAT</span>
                  </div>

                  {/* Action Link */}
                  <Link
                    href={`/events/${event.id}`}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-[#FF5B1E] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all group-hover:shadow-md"
                  >
                    <span>View Pass & Join Squad</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                </div>

              </div>
            )
          })}
        </div>
      </div>

    </section>
  )
}
