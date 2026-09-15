'use client'

import { useMemo, useState, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight, Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  ClipboardList, Compass, Crown, CreditCard, EyeOff, Flame, Handshake, KeyRound, Lock,
  MapPin, Megaphone, Menu, MessageCircle, Moon, QrCode, Search, Send, ShieldCheck,
  Sparkles, Star, Ticket, TrendingUp, UserCheck, Users, X, type LucideIcon,
} from 'lucide-react'
import Logo from '@/components/Logo'

export interface LiveEvent {
  id: string
  title: string
  event_type: string
  city: string
  state?: string
  event_date: string
  vibe?: string
  is_free?: boolean
  cover_image_url?: string
  venue_name?: string
  start_time?: string
  ticket_types?: { price: number }[]
}

interface Props {
  user: { id: string; email?: string } | null
  profile: { username?: string; tier?: string; trust_score?: number } | null
  liveEvents?: LiveEvent[]
}

const photos = {
  hero: '/manus-storage/paddymeet-hero_e7298a92.jpg',
  rooftop: '/manus-storage/paddymeet-rooftop_f107e10f.jpg',
  beach: '/manus-storage/paddymeet-beach_b7c330cf.jpg',
  door: '/manus-storage/paddymeet-security_c7efaed2.jpg',
}

const cardPhotos = [photos.rooftop, photos.hero, photos.beach]

/** Gentle fade-and-rise on scroll into view — the one motion idiom used everywhere. */
function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="PaddyMeet home">
      <Logo theme="white" className={compact ? 'h-6 w-auto' : 'h-7 w-auto'} />
    </Link>
  )
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff8a52] mb-3">
      <span className="w-4 h-px bg-[#ff5b1e]" />
      {children}
    </div>
  )
}

function EventCard({ event, index }: { event: LiveEvent; index: number }) {
  const imageSrc = event.cover_image_url || cardPhotos[index % cardPhotos.length]

  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'Date TBA'

  const lowestPrice = event.is_free
    ? 'Free'
    : event.ticket_types && event.ticket_types.length > 0
      ? `₦${Math.min(...event.ticket_types.map((t) => t.price)).toLocaleString()}`
      : null

  const hasGroupOption = (event.ticket_types?.length ?? 0) > 0

  return (
    <article className="pm-event-card pm-card flex-shrink-0 w-[300px] sm:w-[320px] flex flex-col overflow-hidden">
      <div className="relative h-[190px] overflow-hidden">
        <img src={imageSrc} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-black/45 border border-white/15 text-white/90 backdrop-blur-sm">
          {event.event_type || 'Nightlife'}
        </span>
        <div className="absolute left-4 bottom-3.5 right-4">
          <div className="flex items-center gap-1.5 text-[11px] text-white/80 mb-1">
            <Calendar size={11} />
            {formattedDate}
          </div>
          <h3 className="pm-serif text-[19px] leading-tight text-white truncate">{event.title}</h3>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-1.5 text-[12.5px] text-[#b9a8a0]">
          <MapPin size={13} className="text-[#ff8a52] flex-shrink-0" />
          <span className="truncate">{event.venue_name || event.city}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            {lowestPrice && <div className="text-base font-semibold text-[#f7efe4]">{lowestPrice}</div>}
            {hasGroupOption && (
              <div className="text-[11px] text-[#8c7c76] mt-0.5">Pay &amp; Share available</div>
            )}
          </div>
          <Link
            href={`/events/${event.id}`}
            className="pm-btn pm-btn--primary text-[12px] px-4 py-2.5"
          >
            Get Ticket
          </Link>
        </div>
      </div>
    </article>
  )
}

function ChatMockup() {
  const [messages, setMessages] = useState([
    { name: 'Tunde', text: 'Just reserved a 4-person table on Pay & Share!', time: '9:41 PM' },
    { name: 'Amaka', text: 'Joining from Lekki Phase 1, paid my ₦40k split 🚗', time: '9:44 PM' },
  ])
  const [sent, setSent] = useState(false)

  const addMessage = () => {
    if (sent) return
    setSent(true)
    setMessages((m) => [...m, { name: 'You', text: 'Everyone is in. See you at the door 🎉', time: '9:52 PM' }])
  }

  return (
    <div className="pm-card w-full max-w-[380px] mx-auto overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--pm-border)]">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff5b1e] to-[#f2a93b]" />
        <div>
          <div className="text-sm font-semibold">Lagos Midnight Odyssey</div>
          <div className="text-[11px] text-[#8c7c76]">4 people going together</div>
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">
        {messages.map((m, i) => (
          <div key={`${m.name}-${i}`} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[#3a2a2c] flex-shrink-0 grid place-items-center text-[11px] font-semibold text-[#f2a93b]">
              {m.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[12px] font-semibold text-[#f7efe4]">{m.name}</span>
                <span className="text-[10px] text-[#8c7c76]">{m.time}</span>
              </div>
              <p className="text-[13px] text-[#d8c9c2] leading-relaxed mt-0.5">{m.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5">
        <button
          onClick={addMessage}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-[var(--pm-border)] text-[12.5px] text-[#b9a8a0] hover:text-[#f7efe4] hover:border-[#ff5b1e]/50 transition-colors"
        >
          <Send size={13} /> Say hi to the squad
        </button>
      </div>
    </div>
  )
}

function SplitShareVisual() {
  const people = [
    { name: 'You', amount: '₦40,000' },
    { name: 'Tunde', amount: '₦40,000' },
    { name: 'Amaka', amount: '₦40,000' },
    { name: 'Zainab', amount: '₦40,000' },
  ]
  return (
    <div className="pm-card p-6">
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-[var(--pm-border)]">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-[#8c7c76]">VIP table for four</div>
          <div className="pm-serif text-2xl mt-1">₦160,000 total</div>
        </div>
        <div className="w-11 h-11 rounded-full bg-[#ff5b1e]/15 border border-[#ff5b1e]/30 grid place-items-center text-[#ff8a52]">
          <QrCode size={18} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {people.map((p) => (
          <div key={p.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#3a2a2c] grid place-items-center text-[11px] font-semibold text-[#f2a93b]">
                {p.name.charAt(0)}
              </div>
              <span className="text-[13px] text-[#d8c9c2]">{p.name}{p.name === 'You' && ' (that’s you)'}</span>
            </div>
            <span className="text-[13px] font-semibold text-[#f7efe4]">{p.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LandingClientPage({ liveEvents = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [vibe, setVibe] = useState('All energy')
  const [city, setCity] = useState('Lagos')
  const [energy, setEnergy] = useState('Rave & Afrobeats')
  const [crewType, setCrewType] = useState('Open social crew')
  const [friends, setFriends] = useState(5)
  const carouselRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroPhotoY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])

  const fallbackEvents: LiveEvent[] = [
    { id: 'e1', title: 'Soft Launch Sundays', event_type: 'Rooftop', city: 'Lagos', event_date: '2026-08-29', venue_name: 'The Observatory · VI', vibe: 'Rooftop', ticket_types: [{ price: 18500 }] },
    { id: 'e2', title: 'Midnight Odyssey', event_type: 'Rave', city: 'Abuja', event_date: '2026-09-04', venue_name: 'The Bunker · Wuse II', vibe: 'Rave & electronic', ticket_types: [{ price: 22000 }] },
    { id: 'e3', title: 'Sundown Social Club', event_type: 'Beach day', city: 'Lagos', event_date: '2026-09-06', venue_name: 'Landmark Beach · Oniru', vibe: 'Beach day', ticket_types: [{ price: 12000 }] },
    { id: 'e4', title: 'Afrobeats & Suya Nights', event_type: 'Afrobeats', city: 'Lagos', event_date: '2026-09-12', venue_name: 'Terra Kulture · VI', vibe: 'Afrobeats', ticket_types: [{ price: 15000 }] },
    { id: 'e5', title: 'Capital Sunset Sessions', event_type: 'Rooftop', city: 'Abuja', event_date: '2026-09-19', venue_name: 'Sky Lounge · Maitama', vibe: 'Rooftop', ticket_types: [{ price: 20000 }] },
  ]

  const displayList = liveEvents && liveEvents.length > 0 ? liveEvents : fallbackEvents

  const filteredEvents = vibe === 'All energy'
    ? displayList
    : displayList.filter((e) =>
        e.vibe?.toLowerCase().includes(vibe.toLowerCase().slice(0, 4)) ||
        e.event_type?.toLowerCase().includes(vibe.toLowerCase().slice(0, 4))
      )

  const finalEventList = filteredEvents.length > 0 ? filteredEvents : displayList

  const scrollCarousel = (direction: 'left' | 'right') => {
    carouselRef.current?.scrollBy({ left: direction === 'left' ? -340 : 340, behavior: 'smooth' })
  }

  const vibes = useMemo(
    () => [
      [Compass, 'All energy'],
      [Flame, 'Rave & electronic'],
      [Sparkles, 'Afrobeats'],
      [Star, 'Rooftop'],
      [MapPin, 'Beach day'],
    ] as Array<[LucideIcon, string]>,
    []
  )

  const marqueeVibes = ['Afrobeats', 'Chill', 'Exclusive', 'Amapiano', 'Comedy', 'Day Party', 'Wild', 'Concert', 'Cocktail Night', 'Rooftop', 'Festival', 'Rave']

  const howItWorks = [
    { icon: Search, title: 'Discover events', copy: 'Browse by the feeling you’re chasing tonight — rave, rooftop, beach day, or something in between.' },
    { icon: Handshake, title: 'Join a group', copy: 'Match with people already going, or bring your own crew along for the ride.' },
    { icon: Ticket, title: 'Get tickets', copy: 'Buy solo or split a group ticket. Everyone gets their own pass either way.' },
    { icon: Star, title: 'Build your rep', copy: 'Show up, be good company, and your trust score opens better crews next time.' },
  ]

  const tiers = [
    { icon: Moon, name: 'Newbie', detail: 'Everyone starts here' },
    { icon: Sparkles, name: 'Vibe Explorer', detail: '3+ nights out together' },
    { icon: Crown, name: 'Party Legend', detail: 'The crew’s most trusted' },
  ]

  const reward = friends >= 5 ? '10% off your next 3 tickets' : friends >= 3 ? '5% off your next ticket' : 'a better night, loading'

  const navLinks = [
    ['/events', 'Events'],
    ['/how-it-works', 'How It Works'],
    ['/about', 'About'],
  ]

  return (
    <div id="top" className="pm-page pm-atmosphere">
      <div className="pm-grain" />
      <div className="pm-ambient w-[34rem] h-[34rem] bg-[#ff5b1e] opacity-[0.10] -right-40 top-24" />
      <div className="pm-ambient w-[30rem] h-[30rem] bg-[#f2a93b] opacity-[0.07] -left-40 top-[140rem]" />

      {/* Announcement bar */}
      <div className="relative z-10 h-9 flex items-center justify-center gap-2 text-[11px] text-[#c9b8b0] bg-[#130c0f] border-b border-white/5 px-4 text-center">
        <Sparkles size={12} className="text-[#f2a93b] flex-shrink-0" />
        <span>Now live in Lagos &amp; Abuja</span>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-30 px-4 pt-4">
        <nav className="pm-nav max-w-[1180px] mx-auto flex items-center gap-8 px-3 py-2.5 sm:pl-5">
          <Brand />

          <div className={`${open ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-1 sm:gap-7 absolute sm:static top-[60px] left-3 right-3 sm:top-auto sm:left-auto sm:right-auto p-4 sm:p-0 pm-card sm:bg-transparent sm:border-0 mr-auto`}>
            {navLinks.map(([href, label]) => (
              <Link key={href} href={href} className="text-[13px] text-[#b9a8a0] hover:text-[#f7efe4] transition-colors py-1.5 sm:py-0">
                {label}
              </Link>
            ))}
            <div className="flex sm:hidden flex-col gap-2 mt-2 pt-3 border-t border-[var(--pm-border)]">
              <Link href="/login" className="text-[13px] text-[#b9a8a0] hover:text-[#f7efe4] transition-colors py-1">Log in</Link>
              <Link href="/signup" className="pm-btn pm-btn--primary text-[12.5px] px-5 py-2.5 self-start">
                Get Started <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 ml-auto">
            <Link href="/login" className="text-[13px] text-[#b9a8a0] hover:text-[#f7efe4] transition-colors">Log in</Link>
            <Link href="/signup" className="pm-btn pm-btn--primary text-[12.5px] px-5 py-2.5">
              Get Started <ArrowRight size={14} />
            </Link>
          </div>

          <button className="sm:hidden ml-auto text-[#f7efe4]" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section ref={heroRef} className="max-w-[1240px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
          <div>
            <h1 className="pm-serif font-medium leading-[0.98] tracking-tight text-[clamp(42px,7vw,80px)] mb-6">
              Your next<br />
              <span className="italic text-[#ff8a52]">night out</span><br />
              starts here.
            </h1>
            <p className="text-[15px] sm:text-base text-[#c9b8b0] leading-relaxed max-w-[440px] mb-8">
              Discover events, join groups of like-minded people, coordinate together, and arrive as a crew — safely and anonymously.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-9">
              <Link href="/events" className="pm-btn pm-btn--primary text-[13.5px] px-6 py-3.5">
                Find Events Near Me <ArrowRight size={16} />
              </Link>
              <Link href="/events" className="pm-btn pm-btn--outline text-[13.5px] px-6 py-3.5">
                Browse Events
              </Link>
            </div>

            {/* Interactive filter card */}
            <div className="pm-card p-2 flex flex-col sm:flex-row gap-1 max-w-[560px]">
              <label className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                <MapPin size={15} className="text-[#ff8a52] flex-shrink-0" />
                <span className="sr-only">Where</span>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="bg-transparent text-[13px] outline-none w-full">
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                </select>
                <ChevronDown size={13} className="text-[#8c7c76] flex-shrink-0" />
              </label>
              <div className="hidden sm:block w-px bg-[var(--pm-border)] my-2" />
              <label className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                <Flame size={15} className="text-[#ff8a52] flex-shrink-0" />
                <span className="sr-only">Energy</span>
                <select value={energy} onChange={(e) => setEnergy(e.target.value)} className="bg-transparent text-[13px] outline-none w-full">
                  <option value="Rave & Afrobeats">Rave &amp; Afrobeats</option>
                  <option value="Rooftop lounge">Rooftop lounge</option>
                  <option value="Beach party">Beach party</option>
                </select>
                <ChevronDown size={13} className="text-[#8c7c76] flex-shrink-0" />
              </label>
              <div className="hidden sm:block w-px bg-[var(--pm-border)] my-2" />
              <label className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                <Users size={15} className="text-[#ff8a52] flex-shrink-0" />
                <span className="sr-only">Crew type</span>
                <select value={crewType} onChange={(e) => setCrewType(e.target.value)} className="bg-transparent text-[13px] outline-none w-full">
                  <option value="Open social crew">Open social crew</option>
                  <option value="VIP table split">VIP table split</option>
                </select>
                <ChevronDown size={13} className="text-[#8c7c76] flex-shrink-0" />
              </label>
              <Link
                href={`/events?city=${encodeURIComponent(city)}&vibe=${encodeURIComponent(energy)}`}
                className="pm-btn pm-btn--primary text-[13px] px-5 py-3 flex-shrink-0"
              >
                Find my squad
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-5 mt-6 text-[11.5px] text-[#8c7c76]">
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#f2a93b]" /> Verified</span>
              <span className="flex items-center gap-1.5"><EyeOff size={13} className="text-[#f2a93b]" /> Safe and anonymous</span>
              <span className="flex items-center gap-1.5"><TrendingUp size={13} className="text-[#f2a93b]" /> Trending</span>
            </div>

            {/* Social proof strip */}
            <div className="flex items-center gap-3 mt-7">
              <div className="flex -space-x-2.5">
                {['#ff5b1e', '#f2a93b', '#c96a4e', '#8a5a4a'].map((c, i) => (
                  <span key={i} className="w-8 h-8 rounded-full border-2 border-[var(--pm-bg)]" style={{ background: c }} />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 text-[#f2a93b]">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                </div>
                <div className="text-[11.5px] text-[#8c7c76]">Loved by explorers across Lagos &amp; Abuja</div>
              </div>
            </div>
          </div>

          {/* Hero photo */}
          <motion.div style={{ y: heroPhotoY }} className="relative">
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] sm:aspect-[3/4]">
              <img src={photos.hero} alt="A crowd dancing at a Lagos rave" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
            </div>
            <div className="hidden sm:block absolute -bottom-6 -left-6 right-8 pm-card p-4 backdrop-blur-md bg-[rgba(37,26,28,0.85)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#ff5b1e]/15 border border-[#ff5b1e]/30 grid place-items-center text-[#ff8a52] flex-shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <div className="text-[12.5px] font-semibold">Groups are already forming</div>
                  <div className="text-[11px] text-[#8c7c76]">for this weekend in VI &amp; Wuse II</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Events section */}
        <section id="events" className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <Reveal>
            <SectionEyebrow>Curated by energy, not just dates</SectionEyebrow>
            <h2 className="pm-serif text-[clamp(30px,4.2vw,52px)] leading-[1.02] tracking-tight max-w-[600px] mb-3">
              Pick the night that sounds like you.
            </h2>
            <p className="text-[14px] text-[#b9a8a0] max-w-[480px] leading-relaxed">
              Not every good night needs a reason. Start with a feeling, then find the room.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-wrap gap-2 mt-9 mb-7">
            {vibes.map(([Icon, label]) => (
              <button
                key={label}
                onClick={() => setVibe(label)}
                className={`pm-pill flex items-center gap-2 px-4 py-2.5 rounded-full text-[12.5px] border border-[var(--pm-border)] bg-[var(--pm-card-soft)] text-[#b9a8a0] ${vibe === label ? 'pm-pill--active' : ''}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </Reveal>

          <div className="relative">
            <div ref={carouselRef} className="flex gap-5 overflow-x-auto pb-4 -mx-1 px-1" style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
              {finalEventList.map((e, idx) => (
                <div key={e.id || e.title} style={{ scrollSnapAlign: 'start' }}>
                  <EventCard event={e} index={idx} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <Link href="/events" className="text-[12.5px] font-semibold text-[#ff8a52] flex items-center gap-1.5 hover:gap-2 transition-all">
              See all events <ArrowRight size={13} />
            </Link>
            <div className="hidden sm:flex gap-2">
              <button onClick={() => scrollCarousel('left')} className="w-10 h-10 rounded-full border border-[var(--pm-border)] grid place-items-center hover:border-[#ff5b1e]/50 transition-colors" aria-label="Previous">
                <ChevronLeft size={17} />
              </button>
              <button onClick={() => scrollCarousel('right')} className="w-10 h-10 rounded-full border border-[var(--pm-border)] grid place-items-center hover:border-[#ff5b1e]/50 transition-colors" aria-label="Next">
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* Vibe marquee */}
        <section className="border-y border-white/5 bg-[var(--pm-bg-deep)] overflow-hidden py-4">
          <div className="flex w-max animate-marquee">
            {[...marqueeVibes, ...marqueeVibes, ...marqueeVibes].map((v, i) => (
              <span key={i} className="pm-serif italic text-[15px] text-[#8c7c76] px-6 flex-shrink-0">
                {v}
              </span>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <Reveal className="text-center max-w-[560px] mx-auto mb-14">
            <SectionEyebrow>
              <span className="mx-auto">How it works</span>
            </SectionEyebrow>
            <h2 className="pm-serif text-[clamp(28px,3.6vw,42px)] tracking-tight">
              From &ldquo;maybe tonight&rdquo; to arriving with your crew.
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {howItWorks.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08} className="pm-card-soft p-6">
                <div className="w-11 h-11 rounded-xl bg-[#ff5b1e]/12 border border-[#ff5b1e]/25 grid place-items-center text-[#ff8a52] mb-4">
                  <step.icon size={19} />
                </div>
                <div className="text-[11px] uppercase tracking-wide text-[#8c7c76] mb-1.5">Step {i + 1}</div>
                <h3 className="pm-serif text-lg mb-2">{step.title}</h3>
                <p className="text-[13px] text-[#b9a8a0] leading-relaxed">{step.copy}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Squad section */}
        <section id="squad" className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28 grid lg:grid-cols-[0.95fr_1.05fr] gap-14 items-center">
          <Reveal className="order-2 lg:order-1">
            <ChatMockup />
          </Reveal>

          <Reveal delay={0.1} className="order-1 lg:order-2">
            <SectionEyebrow>Never party alone</SectionEyebrow>
            <h2 className="pm-serif text-[clamp(30px,4vw,48px)] leading-[1.02] tracking-tight mb-4">
              The group chat ends here.
            </h2>
            <p className="text-[14px] text-[#b9a8a0] leading-relaxed max-w-[420px] mb-10">
              A private squad room for the people you&rsquo;re actually meeting at the door. No scattered DMs. No awkward handoffs.
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#ff5b1e]/12 border border-[#ff5b1e]/25 grid place-items-center text-[#ff8a52] flex-shrink-0">
                  <EyeOff size={17} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold mb-1">Privacy, built in</h3>
                  <p className="text-[13px] text-[#8c7c76]">Coordinate the whole night without handing your number to a stranger.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#f2a93b]/12 border border-[#f2a93b]/25 grid place-items-center text-[#f2a93b] flex-shrink-0">
                  <UserCheck size={17} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold mb-1">Reputation over vibes</h3>
                  <p className="text-[13px] text-[#8c7c76]">Verified profiles keep every squad feeling like people you can trust.</p>
                </div>
              </div>
            </div>

            <div className="mt-9 pl-5 border-l-2 border-[#ff5b1e]">
              <p className="pm-serif italic text-xl text-[#f7efe4]">&ldquo;The group chat ends here.&rdquo;</p>
              <p className="text-[11px] text-[#8c7c76] mt-1">— the PaddyMeet rulebook</p>
            </div>
          </Reveal>
        </section>

        {/* Pay & Share section */}
        <section id="split" className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28 grid lg:grid-cols-[0.95fr_1.05fr] gap-14 items-start">
          <Reveal>
            <SectionEyebrow>Pay &amp; Share</SectionEyebrow>
            <h2 className="pm-serif text-[clamp(30px,4vw,48px)] leading-[1.04] tracking-tight mb-4">
              Hold the table.<br />Send the link.<br />Show up together.
            </h2>
            <p className="text-[14px] text-[#b9a8a0] leading-relaxed max-w-[420px] mb-9">
              One person should never have to float the entire night. PaddyMeet turns a group ticket into simple, private payments — everyone pays their own share.
            </p>

            <div className="flex flex-col gap-7">
              {[
                [Lock, 'Lock the group ticket', 'Reserve the table as one group. It stays held for everyone while shares come in.'],
                [Send, 'Send the private link', 'PaddyMeet creates a one-tap link for each friend to pay their piece.'],
                [CreditCard, 'Everyone pays their share', 'Each person checks out separately, for exactly their part of the bill.'],
                [QrCode, 'Get your own pass', 'Once all shares clear, everyone gets their own ticket and QR code.'],
              ].map(([Icon, title, copy], i) => (
                <div key={title as string} className="flex gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-9 h-9 rounded-full border border-[#ff5b1e]/40 bg-[#ff5b1e]/10 text-[#ff8a52] grid place-items-center text-[12px] font-semibold">
                      {i + 1}
                    </div>
                    {i < 3 && <div className="pm-flow-rail flex-1 mt-2" />}
                  </div>
                  <div className="pb-2">
                    <Icon size={16} className="text-[#ff8a52] mb-1.5" />
                    <h3 className="text-[15px] font-semibold mb-1">{title as string}</h3>
                    <p className="text-[13px] text-[#8c7c76] max-w-[320px]">{copy as string}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[12px] text-[#8c7c76] mt-2 pl-13">
              Group tickets stay reserved for a short window while everyone pays their share.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <SplitShareVisual />
          </Reveal>
        </section>

        {/* Safety / trust section */}
        <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28 grid lg:grid-cols-[0.9fr_1.1fr] gap-14 items-center">
          <Reveal className="relative">
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3]">
              <img src={photos.door} alt="A phone being scanned for entry at a venue door" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            </div>
            <div className="absolute left-5 bottom-5 pm-card px-4 py-3 flex items-center gap-2.5 bg-[rgba(37,26,28,0.85)] backdrop-blur-md">
              <ShieldCheck size={16} className="text-[#f2a93b]" />
              <span className="text-[12.5px] font-medium">Verified in seconds</span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <SectionEyebrow>Safety, without the sermon</SectionEyebrow>
            <h2 className="pm-serif text-[clamp(30px,4vw,48px)] leading-[1.02] tracking-tight mb-8">
              The door knows what&rsquo;s real.
            </h2>

            <div className="flex flex-col gap-6">
              {[
                [QrCode, 'One-time QR passes', 'No screenshots, no duplicate entry — each ticket scans once, then it’s done.'],
                [ShieldCheck, 'Everyone is verified', 'Every explorer on PaddyMeet is a real, checked person before they can join a squad.'],
                [KeyRound, 'Your identity, protected', 'Gate teams confirm your ticket fast without ever seeing your personal details.'],
                [TrendingUp, 'Fair, transparent resolution', 'Refund windows and dispute handling are laid out before doors even open.'],
              ].map(([Icon, title, copy]) => (
                <div key={title as string} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-[var(--pm-border)] grid place-items-center text-[#f2a93b] flex-shrink-0">
                    <Icon size={17} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold mb-1">{title as string}</h3>
                    <p className="text-[13px] text-[#8c7c76] max-w-[380px]">{copy as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Organiser section */}
        <section id="organisers" className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <Reveal className="max-w-[560px] mb-12">
            <SectionEyebrow>For the people who make the night</SectionEyebrow>
            <h2 className="pm-serif text-[clamp(30px,4vw,48px)] leading-[1.02] tracking-tight mb-4">
              Your crowd is already looking for you.
            </h2>
            <p className="text-[14px] text-[#b9a8a0] leading-relaxed mb-7">
              PaddyMeet gives promoters, DJs, venues, and festival teams a direct line to the people who want the next drop.
            </p>
            <Link href="/for-organisers" className="pm-btn pm-btn--outline text-[13px] px-6 py-3">
              Open organiser studio <ArrowRight size={15} />
            </Link>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              [Megaphone, 'Reach people already looking', 'Get in front of explorers actively searching for their next night out.'],
              [ClipboardList, 'See your guest list at a glance', 'One clean view of who’s coming, who’s paid, and who to expect at the door.'],
              [MessageCircle, 'Get people talking before doors open', 'Squad chats and Pay & Share get your event buzzing before the night starts.'],
            ].map(([Icon, title, copy], i) => (
              <Reveal key={title as string} delay={i * 0.08} className="pm-card-soft p-6">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-[var(--pm-border)] grid place-items-center text-[#f2a93b] mb-4">
                  <Icon size={19} />
                </div>
                <h3 className="text-[15px] font-semibold mb-2">{title as string}</h3>
                <p className="text-[13px] text-[#8c7c76] leading-relaxed">{copy as string}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Loyalty / perks section */}
        <section className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 sm:py-28 grid lg:grid-cols-[1fr_0.8fr] gap-14">
          <Reveal>
            <SectionEyebrow>Trust has perks</SectionEyebrow>
            <h2 className="pm-serif text-[clamp(28px,3.6vw,42px)] leading-[1.05] tracking-tight mb-4">
              Bring your people. Keep the good energy.
            </h2>
            <p className="text-[14px] text-[#b9a8a0] leading-relaxed max-w-[440px] mb-10">
              Every real connection compounds. Invite your crew and unlock better access as you go.
            </p>

            <div className="flex items-center gap-3 sm:gap-6">
              {tiers.map((t, i) => (
                <div key={t.name} className="flex items-center gap-3 sm:gap-6">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-[var(--pm-border)] grid place-items-center text-[#f2a93b] mb-2">
                      <t.icon size={20} />
                    </div>
                    <div className="text-[12px] font-semibold">{t.name}</div>
                    <div className="text-[10.5px] text-[#8c7c76] mt-0.5 max-w-[90px]">{t.detail}</div>
                  </div>
                  {i < tiers.length - 1 && <div className="w-8 sm:w-12 h-px bg-gradient-to-r from-[#ff5b1e] to-[#f2a93b] mb-8" />}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1} className="pm-card p-7 self-center">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#f2a93b] mb-5">
              <Send size={13} /> Referral calculator
            </div>
            <h3 className="pm-serif text-xl mb-5">How many friends are coming?</h3>
            <div className="pm-serif text-5xl text-[#ff8a52] mb-4">
              {friends}<span className="pm-serif text-sm text-[#8c7c76] not-italic"> friends invited</span>
            </div>
            <input
              type="range" min="1" max="10" value={friends}
              onChange={(e) => setFriends(Number(e.target.value))}
              className="pm-range w-full"
              aria-label="Friends invited"
            />
            <div className="flex justify-between text-[11px] text-[#8c7c76] mt-1.5 mb-6">
              <span>1</span><span>10</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#ff5b1e]/8 border border-[#ff5b1e]/20">
              <CheckCircle2 size={18} className="text-[#f2a93b] flex-shrink-0" />
              <div>
                <div className="text-[12.5px] font-semibold">{reward}</div>
                <div className="text-[10.5px] text-[#8c7c76]">when your link converts</div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Final CTA */}
        <section className="relative mt-8 py-24 sm:py-32 px-5 text-center border-t border-[#ff5b1e]/25 bg-[radial-gradient(50rem_30rem_at_50%_20%,rgba(255,91,30,0.12),transparent_65%),var(--pm-bg-deep)]">
          <Reveal className="max-w-[640px] mx-auto">
            <p className="pm-serif italic text-lg text-[#ff8a52] mb-4">Good plans are better when everyone can say yes.</p>
            <h2 className="pm-serif text-[clamp(32px,5vw,58px)] leading-[1.05] tracking-tight mb-5">
              Your next night out is waiting for you.
            </h2>
            <p className="text-[14px] text-[#b9a8a0] leading-relaxed mb-9 max-w-[480px] mx-auto">
              Thousands of people in Lagos are already finding their crew on PaddyMeet. Sign up in 2 minutes and find your first event today.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-9">
              <Link href="/signup" className="pm-btn pm-btn--primary text-[13.5px] px-7 py-3.5">
                Get Started <ArrowRight size={16} />
              </Link>
              <Link href="/for-organisers" className="pm-btn pm-btn--outline text-[13.5px] px-7 py-3.5">
                Host an event
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[12.5px] text-[#b9a8a0]">
              {['Free to sign up', 'Identity verified', 'Completely anonymous', 'Events near you'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check size={13} className="text-[#f2a93b]" /> {item}
                </span>
              ))}
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--pm-bg-deep)] px-5 sm:px-8">
        <div className="max-w-[1180px] mx-auto py-14 grid sm:grid-cols-[1fr_1.4fr] gap-12 border-b border-white/5">
          <div>
            <Brand compact />
            <p className="text-[13px] text-[#8c7c76] mt-4 max-w-[240px] leading-relaxed">
              Made for the nights you talk about later.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#ff8a52] mb-1">Platform</span>
              <Link href="/events" className="text-[12.5px] text-[#8c7c76] hover:text-[#f7efe4] transition-colors">Live events</Link>
              <a href="#squad" className="text-[12.5px] text-[#8c7c76] hover:text-[#f7efe4] transition-colors">Find your crew</a>
              <a href="#split" className="text-[12.5px] text-[#8c7c76] hover:text-[#f7efe4] transition-colors">Pay &amp; Share</a>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#ff8a52] mb-1">Company</span>
              <Link href="/about" className="text-[12.5px] text-[#8c7c76] hover:text-[#f7efe4] transition-colors">About</Link>
              <Link href="/for-organisers" className="text-[12.5px] text-[#8c7c76] hover:text-[#f7efe4] transition-colors">For organisers</Link>
              <Link href="/contact" className="text-[12.5px] text-[#8c7c76] hover:text-[#f7efe4] transition-colors">Contact</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#ff8a52] mb-1">Legal</span>
              <Link href="/trust-and-safety" className="text-[12.5px] text-[#8c7c76] hover:text-[#f7efe4] transition-colors">Trust &amp; safety</Link>
              <Link href="/refund-policy" className="text-[12.5px] text-[#8c7c76] hover:text-[#f7efe4] transition-colors">Refund policy</Link>
              <Link href="/terms" className="text-[12.5px] text-[#8c7c76] hover:text-[#f7efe4] transition-colors">Terms</Link>
            </div>
          </div>
        </div>

        <div className="max-w-[1180px] mx-auto py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#6b5b56]">
          <span>© 2026 PaddyMeet, Lagos / Abuja</span>
          <span>Instagram · X · TikTok · LinkedIn</span>
        </div>
      </footer>
    </div>
  )
}
