'use client'

import { useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowDownRight, ArrowRight, BellRing, CalendarDays, Check,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign,
  Compass, CreditCard, EyeOff, FileSpreadsheet, Flame, KeyRound,
  MapPin, Menu, MessageCircle, MessageSquare, Plus, QrCode, Radio,
  ScanLine, Send, ShieldCheck, Sparkles, Star, TrendingUp,
  UserCheck, Users, WalletCards, X, Zap
} from 'lucide-react'

const orange = '#FF5B1E'

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
  user: any
  profile: any
  liveEvents?: LiveEvent[]
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="PaddyMeet home">
      <span className="brand-mark">
        <Zap className="w-5 h-5 text-white fill-white" />
      </span>
      <span className="brand-word">
        Paddy<span>Meet</span>
      </span>
    </Link>
  )
}

function IconBadge({ children, tone = 'orange' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`icon-badge icon-badge--${tone}`}>{children}</span>
}

function SectionHead({ eyebrow, title, copy, number }: { eyebrow: string; title: React.ReactNode; copy?: string; number?: string }) {
  return (
    <div className="section-head">
      <div className="section-index">{number || '//'}</div>
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        {copy && <p>{copy}</p>}
      </div>
    </div>
  )
}

/**
 * Hero VIP Live Pass Card with Real Photography Artwork and QR Pass
 */
function TiltPass({ topEvent }: { topEvent?: LiveEvent }) {
  const [transform, setTransform] = useState('rotateX(2deg) rotateY(-5deg)')

  const formattedDate = topEvent?.event_date
    ? new Date(topEvent.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '29 / 08 / 26'

  return (
    <div
      className="pass-stage"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        setTransform(`rotateX(${y * -8 + 2}deg) rotateY(${x * 12 - 5}deg)`)
      }}
      onMouseLeave={() => setTransform('rotateX(2deg) rotateY(-5deg)')}
    >
      <div className="pass-glow" />
      <div className="pass-card" style={{ transform }}>
        <div className="pass-top">
          <span className="flex items-center gap-1.5">
            <Radio size={11} className="text-emerald-400 animate-pulse" />
            PADDYMEET / LIVE PASS
          </span>
          <span>PM–{topEvent?.id?.slice(0, 4).toUpperCase() || '0429'}</span>
        </div>
        <div className="pass-art">
          <img
            src={topEvent?.cover_image_url || '/manus-storage/paddymeet-hero_e7298a92.jpg'}
            alt={topEvent?.title || 'Crowd at a Lagos night event'}
          />
          <div className="pass-art-overlay" />
          <div className="pass-art-copy">
            <small>THE NEXT NIGHT OUT</small>
            <strong>{topEvent?.title || 'ODYSSEY AFTER DARK'}</strong>
          </div>
        </div>
        <div className="pass-meta">
          <div>
            <span>VENUE</span>
            <b>{topEvent?.venue_name || 'Terra Kulture'}</b>
          </div>
          <div>
            <span>DATE</span>
            <b>{formattedDate}</b>
          </div>
          <div>
            <span>CITY</span>
            <b>{topEvent?.city?.toUpperCase() || 'LAGOS, NG'}</b>
          </div>
        </div>
        <div className="pass-divider">
          <span /><i>SCANNABLE / VERIFIED</i><span />
        </div>
        <div className="pass-bottom">
          <div className="pass-qr"><QrCode size={52} /></div>
          <div>
            <small>SQUAD INVENTORY</small>
            <strong>3 seats left</strong>
            <div className="avatars">
              <span>F</span><span>M</span><span>+</span>
            </div>
          </div>
          <ShieldCheck className="pass-shield" size={24} />
        </div>
      </div>
      <div className="float-chip float-chip--top">
        <Radio size={13} /> 218 squads active
      </div>
      <div className="float-chip float-chip--bottom">
        <CheckCircle2 size={13} /> Trust verified
      </div>
    </div>
  )
}

const defaultCardImages = [
  '/manus-storage/paddymeet-rooftop_f107e10f.jpg',
  '/manus-storage/paddymeet-hero_e7298a92.jpg',
  '/manus-storage/paddymeet-beach_b7c330cf.jpg',
]

const defaultTones = ['orange', 'purple', 'gold']

function EventCard({ event, index }: { event: LiveEvent; index: number }) {
  const imageSrc =
    event.cover_image_url || defaultCardImages[index % defaultCardImages.length]
  const tone = defaultTones[index % defaultTones.length]

  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
    : 'SAT · 29 AUG'

  const lowestPrice =
    event.is_free
      ? 'FREE'
      : event.ticket_types && event.ticket_types.length > 0
      ? `₦${Math.min(...event.ticket_types.map((t) => t.price)).toLocaleString()}`
      : '₦10,000'

  const tag = `${(event.event_type || 'NIGHTLIFE').toUpperCase()} / ${(event.city || 'LAGOS').toUpperCase()}`

  return (
    <article className="event-card">
      <div className="event-image">
        <img src={imageSrc} alt={event.title} />
        <div className="event-overlay" />
        <span className={`event-tag event-tag--${tone}`}>
          <Radio className="w-2 h-2 text-emerald-400 animate-pulse" />
          {tag}
        </span>
        <button className="save-button" aria-label={`Save ${event.title}`}>
          <Star size={14} />
        </button>
        <div className="event-title">
          <small>
            <CalendarDays className="w-2.5 h-2.5 text-orange-400" />
            {formattedDate}
          </small>
          <h3>{event.title}</h3>
        </div>
      </div>
      <div className="event-body">
        <div className="event-location">
          <MapPin size={13} className="text-orange-400 flex-shrink-0" />
          <span className="truncate">{event.venue_name || event.city}</span>
        </div>
        <div className="event-row">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-orange-600/80 border border-gray-900 text-[9px] grid place-items-center font-bold text-white">T</span>
              <span className="w-5 h-5 rounded-full bg-purple-600/80 border border-gray-900 text-[9px] grid place-items-center font-bold text-white">A</span>
              <span className="w-5 h-5 rounded-full bg-emerald-600/80 border border-gray-900 text-[8px] grid place-items-center font-bold text-white">+3</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">3 squads active</span>
          </div>
          <strong className="text-sm font-bold text-white">{lowestPrice}</strong>
        </div>
        <div className="event-footer">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Pay & Share</span>
          </span>
          <Link
            href={`/events/${event.id}`}
            className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-md border border-orange-500/20 transition-colors"
          >
            <span>Get Ticket</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  )
}

/**
 * Section 02: Squad Room Interactive Chat Simulator
 * (Client item: Chat interface replacement in Section 02 - Never Party Alone)
 */
function SquadRoom() {
  const [messages, setMessages] = useState([
    'Just reserved a 4-person table on Pay & Share!',
    'Joining from Lekki Phase 1, paid my ₦40k split 🚗',
  ])
  const addMessage = () => setMessages((m) => [...m, 'Payment confirmed for 4/4 members. Individual QR passes dropped.'])
  
  return (
    <div className="squad-layout">
      <div className="phone-shell">
        <div className="phone-notch" />
        <div className="squad-top">
          <div>
            <small>SQUAD ROOM / 04</small>
            <strong>Lagos Midnight Odyssey</strong>
          </div>
          <IconBadge tone="mint"><ShieldCheck size={15} /></IconBadge>
        </div>
        <div className="squad-sub">
          <span><Users size={13} /> VIP Balcony Crew</span>
          <b><CheckCircle2 size={10} /> TRUST SCORE 85+</b>
        </div>
        <div className="chat-stream">
          {messages.map((msg, i) => (
            <div className={`chat-line ${i === 2 ? 'chat-line--system' : ''}`} key={`${msg}-${i}`}>
              <span className={`chat-avatar chat-avatar--${i}`}>
                {i === 2 ? <Check size={13} /> : ['T', 'A'][i]}
              </span>
              <div>
                <small>{i === 2 ? 'PADDYBOT CONCIERGE · JUST NOW' : ['TUNDE · VERIFIED EXPLORER', 'AMAKA · VIBE EXPLORER'][i]}</small>
                <p>{msg}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="chat-action" onClick={addMessage}>
          <Send size={14} /> simulate payment confirmation
        </button>
        <div className="phone-footer">
          <span><EyeOff size={13} /> no phone numbers shared</span>
          <span className="online-dot" /> 4/4 ready
        </div>
      </div>

      <div className="feature-stack">
        <div className="feature-callout">
          <IconBadge tone="purple"><EyeOff size={17} /></IconBadge>
          <div>
            <h3>Privacy, built in.</h3>
            <p>Coordinate the full night without handing your number to a stranger.</p>
          </div>
        </div>
        <div className="feature-callout">
          <IconBadge tone="mint"><UserCheck size={17} /></IconBadge>
          <div>
            <h3>Reputation over vibes.</h3>
            <p>Verified profiles and trust scores keep the squad feeling safe.</p>
          </div>
        </div>
        <div className="quote-slab">
          <span>“</span>
          <p>The group chat ends here.</p>
          <small>— the PaddyMeet rulebook, page 01</small>
        </div>
      </div>
    </div>
  )
}

function SplitFlow() {
  const steps: Array<[any, string, string, string]> = [
    [ShieldCheck, '01', 'Lock the group ticket', 'Reserve a 5-person pass. Inventory stays locked for 10 minutes.'],
    [Send, '02', 'Send the private link', 'PaddyMeet creates a one-click share link for each friend.'],
    [CreditCard, '03', 'Everyone pays their share', 'Each person pays the exact split at their own checkout.'],
    [QrCode, '04', 'Get your own QR pass', 'All shares clear? Individual encrypted passes drop instantly.'],
  ]
  return (
    <div className="split-flow">
      {steps.map(([I, n, title, copy], i) => (
        <div className={`flow-step ${i === 0 ? 'flow-step--active' : ''}`} key={n}>
          <div className="flow-rail">
            <span>{n}</span>
            {i < steps.length - 1 && <i />}
          </div>
          <div>
            <div className="flow-icon"><I size={20} /></div>
            <h3>{title}</h3>
            <p>{copy}</p>
          </div>
          {i === 0 && (
            <div className="hold-timer">
              <span>RESERVATION LOCK</span>
              <strong>09:42</strong>
              <small>still holding 5 spots</small>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function LandingClientPage({ user, profile, liveEvents = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [vibe, setVibe] = useState('All energy')
  const [city, setCity] = useState('Lagos')
  const [energy, setEnergy] = useState('Rave & Afrobeats')
  const [crewType, setCrewType] = useState('Open social crew')
  const [friends, setFriends] = useState(5)
  const carouselRef = useRef<HTMLDivElement>(null)

  const fallbackEvents: LiveEvent[] = [
    {
      id: 'e1',
      title: 'Soft Launch Sundays',
      event_type: 'Rooftop',
      city: 'Lagos',
      event_date: '2026-08-29',
      venue_name: 'The Observatory · VI',
      vibe: 'Rooftop',
      ticket_types: [{ price: 18500 }],
    },
    {
      id: 'e2',
      title: 'Midnight Odyssey',
      event_type: 'Rave',
      city: 'Abuja',
      event_date: '2026-09-04',
      venue_name: 'The Bunker · Wuse II',
      vibe: 'Rave & electronic',
      ticket_types: [{ price: 22000 }],
    },
    {
      id: 'e3',
      title: 'Sundown Social Club',
      event_type: 'Beach day',
      city: 'Lagos',
      event_date: '2026-09-06',
      venue_name: 'Landmark Beach · Oniru',
      vibe: 'Beach day',
      ticket_types: [{ price: 12000 }],
    },
    {
      id: 'e4',
      title: 'Afrobeats & Suya Nights',
      event_type: 'Afrobeats',
      city: 'Lagos',
      event_date: '2026-09-12',
      venue_name: 'Terra Kulture · VI',
      vibe: 'Afrobeats',
      ticket_types: [{ price: 15000 }],
    },
    {
      id: 'e5',
      title: 'Capital Sunset Sessions',
      event_type: 'Rooftop',
      city: 'Abuja',
      event_date: '2026-09-19',
      venue_name: 'Sky Lounge · Maitama',
      vibe: 'Rooftop',
      ticket_types: [{ price: 20000 }],
    },
  ]

  const displayList = liveEvents && liveEvents.length > 0 ? liveEvents : fallbackEvents

  // Filter events based on energy tab
  const filteredEvents =
    vibe === 'All energy'
      ? displayList
      : displayList.filter(
          (e) =>
            e.vibe?.toLowerCase().includes(vibe.toLowerCase().slice(0, 4)) ||
            e.event_type?.toLowerCase().includes(vibe.toLowerCase().slice(0, 4))
        )

  const finalEventList = filteredEvents.length > 0 ? filteredEvents : displayList
  const topUpcomingEvent = displayList[0]

  // Carousel Navigation Handler
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const reward = friends >= 5 ? '10% off your next 3 tickets' : friends >= 3 ? '5% off your next ticket' : 'A better night, loading'
  const vibes = useMemo(
    () => [
      [Compass, 'All energy'],
      [Flame, 'Rave & electronic'],
      [Sparkles, 'Afrobeats'],
      [CircleDollarSign, 'Rooftop'],
      [MapPin, 'Beach day'],
    ] as Array<[any, string]>,
    []
  )

  const links = [
    ['/events', 'Events'],
    ['/how-it-works', 'How It Works'],
    ['/about', 'About'],
  ]

  return (
    <div id="top" className="site-shell">
      <div className="grain" />
      <div className="ambient ambient--orange" />
      <div className="ambient ambient--purple" />

      {/* Activity Strip */}
      <div className="activity-strip">
        <span className="live-dot" /> LIVE NOW{' '}
        <span className="activity-copy">142 squads forming in VI & Lekki right now</span>
        <Link href="/events" className="activity-action">
          <span>open activity feed</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* Clean Site Navigation Bar */}
      <header className="nav-wrap">
        <nav className="nav-bar">
          <Brand />
          
          <div className={`nav-links ${open ? 'nav-links--open' : ''}`}>
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="nav-link font-medium">
                {label}
              </Link>
            ))}
            {open && (
              <div className="mobile-nav-city flex items-center gap-1 text-orange-400">
                <Sparkles size={14} /> Lagos / Abuja
              </div>
            )}
          </div>

          <div className="nav-actions">
            <Link href="/login" className="login font-medium">Log in</Link>
            <Link href="/signup" className="button button--small">
              <span>Get early access</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X /> : <Menu />}
          </button>
        </nav>
      </header>

      {/* Main Content Sections */}
      <main>
        
        {/* Hero Section */}
        <section className="section-pad hero">
          <div className="hero-copy">
            <div className="kicker mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping inline-block mr-2" />
              NOW LIVE IN LAGOS & ABUJA
            </div>
            <h1>
              Your next<br />
              <span style={{ color: '#FF5B1E', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>night out</span><br />
              <span style={{ color: '#9ca3af', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>starts here.</span>
            </h1>
            <p className="hero-lede">
              Discover events, join groups of like-minded people, coordinate together, and arrive as a crew — safely and anonymously.
            </p>

            {/* Direct Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-6">
              <Link className="button text-sm px-6 py-3.5 font-bold" href="/events">
                <span>Find Events Near Me</span>
                <ArrowRight size={16} />
              </Link>
              <Link className="button button--outline text-sm px-6 py-3.5 font-bold" href="/events">
                <span>Browse Events</span>
              </Link>
            </div>

            {/* Weekend Matcher Bar */}
            <div className="matcher">
              <div className="matcher-field">
                <MapPin size={16} />
                <label>WHERE</label>
                <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Where location">
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                </select>
                <ChevronDown size={14} />
              </div>

              <div className="matcher-field">
                <Flame size={16} />
                <label>THE ENERGY</label>
                <select value={energy} onChange={(e) => setEnergy(e.target.value)} aria-label="Energy vibe">
                  <option value="Rave & Afrobeats">Rave & Afrobeats</option>
                  <option value="Rooftop lounge">Rooftop lounge</option>
                  <option value="Beach party">Beach party</option>
                </select>
                <ChevronDown size={14} />
              </div>

              <div className="matcher-field">
                <Users size={16} />
                <label>CREW TYPE</label>
                <select value={crewType} onChange={(e) => setCrewType(e.target.value)} aria-label="Crew setup">
                  <option value="Open social crew">Open social crew</option>
                  <option value="VIP table split">VIP table split</option>
                </select>
                <ChevronDown size={14} />
              </div>

              <Link className="button matcher-button" href={`/events?city=${encodeURIComponent(city)}&vibe=${encodeURIComponent(energy)}`}>
                <span>Find my squad</span>
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="hero-note">
              <span><CheckCircle2 size={14} /> verified people</span>
              <span><ShieldCheck size={14} /> encrypted passes</span>
              <span><WalletCards size={14} /> easy split payments</span>
              <span className="hero-route">VI → ONIRU → WUSE II</span>
            </div>
          </div>

          {/* Primary Event VIP Pass Visual on Right */}
          <TiltPass topEvent={topUpcomingEvent} />
        </section>

        {/* Live Ticker with Vector Icons */}
        <section className="ticker">
          <div className="ticker-track">
            <span>LAGOS / ABUJA <Sparkles className="w-3.5 h-3.5 text-orange-400 inline ml-2" /></span>
            <span>FIND YOUR CREW <Users className="w-3.5 h-3.5 text-purple-400 inline ml-2" /></span>
            <span>PAY YOUR SHARE <CreditCard className="w-3.5 h-3.5 text-emerald-400 inline ml-2" /></span>
            <span>ARRIVE TOGETHER <ShieldCheck className="w-3.5 h-3.5 text-gold inline ml-2" /></span>
            <span>LAGOS / ABUJA <Sparkles className="w-3.5 h-3.5 text-orange-400 inline ml-2" /></span>
            <span>FIND YOUR CREW <Users className="w-3.5 h-3.5 text-purple-400 inline ml-2" /></span>
          </div>
        </section>

        {/* Section 01: Horizontally Swiping Events Showcase Below Hero */}
        <section id="events" className="section-pad events-section-wrap">
          <SectionHead
            number="01"
            eyebrow="Curated by energy, not just dates"
            title="Pick the night that sounds like you."
            copy="Not every good night needs a reason. Start with a feeling, then find the room."
          />
          
          <div className="vibe-row">
            {vibes.map(([I, label]) => (
              <button
                key={label}
                className={`vibe-pill ${vibe === label ? 'vibe-pill--active' : ''}`}
                onClick={() => setVibe(label)}
              >
                <I size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Horizontal Swiping Event Carousel */}
          <div className="carousel-container">
            <div className="carousel-track" ref={carouselRef}>
              {finalEventList.map((e, idx) => (
                <EventCard event={e} index={idx} key={e.id || e.title} />
              ))}
            </div>
          </div>

          {/* Carousel Controls & Pagination */}
          <div className="carousel-controls">
            <span className="text-xs text-gray-400 tracking-wider font-semibold">
              {finalEventList.length < 10 ? `0${finalEventList.length}` : finalEventList.length} LIVE UPCOMING EVENTS IN LAGOS & ABUJA
            </span>
            <div className="carousel-arrows">
              <button
                onClick={() => scrollCarousel('left')}
                className="carousel-arrow-btn"
                aria-label="Previous events"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="carousel-arrow-btn"
                aria-label="Next events"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>

        {/* Section 02: Squad Section with Realistic Dummy Chat Simulator */}
        <section id="squad" className="section-pad squad-section">
          <SectionHead
            number="02"
            eyebrow="Never party alone"
            title="The group chat ends here."
            copy="A private squad room for the people you are actually meeting at the door. No scattered DMs. No awkward handoffs."
          />
          <SquadRoom />
        </section>

        {/* Section 03: Split Section */}
        <section id="split" className="section-pad split-section">
          <div className="split-intro">
            <SectionHead
              number="03"
              eyebrow="Pay & share"
              title={
                <>
                  Hold the table.<br />
                  <span>Send the link.</span><br />
                  Show up together.
                </>
              }
              copy="One person should never have to float the entire night. PaddyMeet turns a group ticket into four simple, private payments."
            />
            <div className="split-proof">
              <div><strong>₦200k</strong><span>table total</span></div>
              <div className="proof-arrow">→</div>
              <div><strong>₦40k</strong><span>your exact share</span></div>
            </div>
          </div>
          <SplitFlow />
        </section>

        {/* Section 04: Trust Section */}
        <section className="section-pad trust-section">
          <div className="trust-visual">
            <img src="/manus-storage/paddymeet-security_c7efaed2.jpg" alt="Verified QR security scan" />
            <div className="scan-card">
              <ScanLine size={23} />
              <div>
                <small>GATEKEEPER MODE</small>
                <strong>READY TO SCAN</strong>
              </div>
              <span className="scan-ping" />
            </div>
          </div>

          <div className="trust-copy">
            <SectionHead
              number="04"
              eyebrow="Safety, without the sermon"
              title="The door knows what is real."
              copy="One-time encrypted QR passes, dedicated staff passkeys, and a clear refund trail make the hard parts invisible to the people having a good night."
            />
            <div className="proof-list">
              <div>
                <IconBadge tone="mint"><QrCode size={17}/></IconBadge>
                <div>
                  <b>One-time QR security</b>
                  <p>No screenshots. No duplicate entry. No guesswork.</p>
                </div>
              </div>
              <div>
                <IconBadge tone="gold"><KeyRound size={17}/></IconBadge>
                <div>
                  <b>Staff passkeys</b>
                  <p>Gate teams can verify fast without seeing your personal data.</p>
                </div>
              </div>
              <div>
                <IconBadge tone="purple"><TrendingUp size={17}/></IconBadge>
                <div>
                  <b>Transparent arbitration</b>
                  <p>Refund windows and feedback logs are visible before doors open.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 05: Organisers Section with Engagement Metrics */}
        <section id="organisers" className="section-pad organiser-section">
          <div className="organiser-copy">
            <SectionHead
              number="05"
              eyebrow="For the people who make the night"
              title="Your crowd is already looking for you."
              copy="PaddyMeet gives promoters, DJs, venues, and festival teams a direct line to the people who want the next drop."
            />
            <Link className="button button--outline" href="/for-organisers">
              <span>Open organiser studio</span>
              <ArrowDownRight size={16} />
            </Link>
          </div>

          <div className="studio-grid">
            <div className="studio-card studio-card--wide">
              <div className="studio-card-top">
                <BellRing size={17} />
                <span>FOLLOWER DROP</span>
                <b><CheckCircle2 size={11} /> LIVE</b>
              </div>
              <strong>2,418</strong>
              <p>people waiting for your next event</p>
              <div className="mini-bars">
                <i /><i /><i /><i /><i /><i /><i /><i /><i />
              </div>
            </div>

            <div className="studio-card">
              <IconBadge tone="gold"><Users size={17} /></IconBadge>
              <strong>3,840+</strong>
              <p>squads formed across Lagos & Abuja</p>
            </div>

            <div className="studio-card">
              <IconBadge tone="purple"><FileSpreadsheet size={17} /></IconBadge>
              <strong>1 click</strong>
              <p>guest manifest for your gate team</p>
            </div>

            {/* Engagement Metrics */}
            <div className="studio-card studio-card--wide studio-card--engagement">
              <div>
                <span className="text-xs font-bold text-gray-400 tracking-wider">ORGANISER & ATTENDEE ENGAGEMENT</span>
                <strong>94.2%</strong>
                <p className="text-xs text-gray-400">social squad completion & repeat attendance rate</p>
              </div>
              <TrendingUp size={38} className="text-emerald-400" />
              <small>
                <CheckCircle2 size={12} className="text-emerald-400" />
                +18.4% community growth this week
              </small>
            </div>
          </div>
        </section>

        {/* Section 06: Perks Section */}
        <section className="section-pad perks-section">
          <div className="perks-copy">
            <SectionHead
              number="06"
              eyebrow="Trust has perks"
              title="Bring your people. Keep the good energy."
              copy="Every real connection compounds. Invite your crew, unlock better access, and move up the night-life index."
            />
            <div className="tier-rail">
              <div className="tier tier--done">
                <span>01</span>
                <b>NEWBIE</b>
                <small>50 pts</small>
              </div>
              <div className="tier-line">
                <i style={{ width: '62%' }} />
              </div>
              <div className="tier tier--current">
                <span>02</span>
                <b>VIBE EXPLORER</b>
                <small>150 pts</small>
              </div>
              <div className="tier">
                <span>03</span>
                <b>PARTY LEGEND</b>
                <small>300 pts</small>
              </div>
            </div>
          </div>

          <div className="referral-widget">
            <div className="widget-label">
              <Send size={15} />
              <span>REFERRAL CALCULATOR</span>
            </div>
            <h3>How many friends are coming?</h3>
            <div className="friend-count">
              {friends}<small> friends invited</small>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={friends}
              onChange={(e) => setFriends(Number(e.target.value))}
              aria-label="Friends range slider"
            />
            <div className="range-labels">
              <span>1</span>
              <span>10</span>
            </div>
            <div className="reward-result">
              <CheckCircle2 size={18} />
              <span>
                <b>{reward}</b>
                <small>when your link converts</small>
              </span>
            </div>
          </div>
        </section>

        {/* Section 07: Final CTA Section */}
        <section id="cta" className="final-cta section-pad">
          <div className="cta-inner">
            <div className="cta-rings" />
            <div className="kicker">
              <Sparkles size={15} /> THE NIGHT IS WAITING
            </div>
            <h2>
              Your next<br />
              <em>unforgettable</em> night<br />
              starts here.
            </h2>
            <p>Good plans are better when everyone can say yes.</p>
            <div className="cta-actions">
              <Link className="button" href="/events">
                <span>Explore live events</span>
                <ArrowRight size={17} />
              </Link>
              <Link className="button button--outline" href="/for-organisers">
                <Plus size={17} />
                <span>Host an event</span>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Cyber Footer */}
      <footer id="footer" className="footer">
        <div className="footer-top">
          <div>
            <Brand compact />
            <p>Made for the nights you talk about later.</p>
            <div className="footer-status">
              <span className="online-dot" /> ALL GATE SYSTEMS OPERATIONAL
            </div>
          </div>

          <div className="footer-links">
            <div>
              <small>DISCOVER</small>
              <Link href="/events">Live events</Link>
              <a href="#squad">Find your crew</a>
              <a href="#split">Pay & Share</a>
            </div>
            <div>
              <small>ORGANISERS</small>
              <Link href="/for-organisers">Growth studio</Link>
              <Link href="/for-organisers">Host an event</Link>
              <Link href="/scan">Gatekeeper portal</Link>
            </div>
            <div>
              <small>SAFETY & TRUST</small>
              <Link href="/trust-and-safety">How it works</Link>
              <Link href="/refund-policy">Refund policy</Link>
              <Link href="/terms">Community rules</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 PaddyMeet, Lagos / Abuja</span>
          <span>Instagram · X · TikTok · LinkedIn</span>
          <span>
            Built for the next good night <Zap size={13} className="text-orange-500 inline ml-1" />
          </span>
        </div>
      </footer>
    </div>
  )
}
