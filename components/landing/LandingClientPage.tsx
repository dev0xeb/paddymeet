'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownRight, ArrowRight, BellRing, CalendarDays, Check,
  CheckCircle2, ChevronDown, CircleDollarSign, Compass, CreditCard,
  EyeOff, FileSpreadsheet, Flame, KeyRound, MapPin, Menu, MessageCircle,
  Plus, QrCode, Radio, ScanLine, Send, ShieldCheck, Sparkles, Star,
  TrendingUp, UserCheck, Users, WalletCards, X, Zap
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

function TiltPass({ topEvent }: { topEvent?: LiveEvent }) {
  const [transform, setTransform] = useState('rotateX(3deg) rotateY(-8deg)')

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
        setTransform(`rotateX(${y * -10 + 3}deg) rotateY(${x * 16 - 8}deg)`)
      }}
      onMouseLeave={() => setTransform('rotateX(3deg) rotateY(-8deg)')}
    >
      <div className="pass-glow" />
      <div className="pass-card" style={{ transform }}>
        <div className="pass-top">
          <span>PADDYMEET / LIVE PASS</span>
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
          <div className="pass-qr"><QrCode size={54} /></div>
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
      <div className="float-chip float-chip--top"><Radio size={13} /> 218 squads active</div>
      <div className="float-chip float-chip--bottom"><CheckCircle2 size={13} /> Trust verified</div>
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
      : '₦15,000'

  const tag = `${(event.event_type || 'NIGHTLIFE').toUpperCase()} / ${(event.city || 'LAGOS').toUpperCase()}`

  return (
    <article className="event-card">
      <div className="event-image">
        <img src={imageSrc} alt={event.title} />
        <div className="event-overlay" />
        <span className={`event-tag event-tag--${tone}`}>{tag}</span>
        <button className="save-button" aria-label={`Save ${event.title}`}><Star size={16} /></button>
        <div className="event-title">
          <small>{formattedDate}</small>
          <h3>{event.title}</h3>
        </div>
      </div>
      <div className="event-body">
        <div className="event-location">
          <MapPin size={14} />
          <span>{event.venue_name || event.city}</span>
        </div>
        <div className="event-row">
          <span className="group-count"><Users size={14} /> 3 social groups forming</span>
          <strong>{lowestPrice}</strong>
        </div>
        <div className="event-footer">
          <span><ShieldCheck size={13} /> 10 min hold</span>
          <Link href={`/events/${event.id}`} className="hover:text-[#FF5B1E] flex items-center gap-1">
            <span>Join Squad</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  )
}

function SquadRoom() {
  const [messages, setMessages] = useState([
    'Just reserved 4 seats on Pay & Share!',
    'Joining from Lekki Phase 1, can carpool 2 people!'
  ])
  const addMessage = () => setMessages((m) => [...m, 'Payment confirmed for 4/4 members. QR passes issued.'])
  
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
          <b>TRUST SCORE 85+</b>
        </div>
        <div className="chat-stream">
          {messages.map((msg, i) => (
            <div className={`chat-line ${i === 2 ? 'chat-line--system' : ''}`} key={`${msg}-${i}`}>
              <span className={`chat-avatar chat-avatar--${i}`}>
                {i === 2 ? <Check size={13} /> : ['A', 'J'][i]}
              </span>
              <div>
                <small>{i === 2 ? 'PADDYBOT · JUST NOW' : ['AMAKA · VERIFIED EXPLORER', 'JIDE · VIBE EXPLORER'][i]}</small>
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

function Share2Icon() {
  return <Send size={17} />
}

export default function LandingClientPage({ user, profile, liveEvents = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [vibe, setVibe] = useState('All energy')
  const [city, setCity] = useState('Lagos')
  const [energy, setEnergy] = useState('Rave & Afrobeats')
  const [crewType, setCrewType] = useState('Open social crew')
  const [friends, setFriends] = useState(5)

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
          open activity feed <ArrowRight size={12} />
        </Link>
      </div>

      {/* Site Navigation Bar */}
      <header className="nav-wrap">
        <nav className="nav-bar">
          <Brand />
          
          <div className={`nav-links ${open ? 'nav-links--open' : ''}`}>
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="nav-link">
                {label}
              </Link>
            ))}
            <a href="#organisers">For Organisers</a>
            {open && <div className="mobile-nav-city"><Sparkles size={14} /> Lagos / Abuja</div>}
          </div>

          <div className="nav-actions">
            <span className="nav-live"><Radio size={14} /> 142 active</span>
            <Link href="/login" className="login">Log in</Link>
            <Link href="/signup" className="button button--small">
              Get early access <ArrowRight size={14} />
            </Link>
          </div>

          <button className="mobile-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X /> : <Menu />}
          </button>
        </nav>
      </header>

      {/* Main Content Sections */}
      <main>
        
        {/* Section 0: Hero Section */}
        <section className="hero section-pad">
          <div className="hero-copy">
            <div className="kicker">
              <Sparkles size={15} /> THE NEXT-GEN NIGHTLIFE PLATFORM
            </div>
            <h1>
              DON’T JUST BUY<br />
              <em>A TICKET.</em><br />
              <span>FIND YOUR CREW.</span>
            </h1>
            <p className="hero-lede">
              The social ticketing platform built for Lagos and Abuja nightlife. Form private squads, split VIP tables with 1-click Pay & Share, and step into the event verified.
            </p>

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
                Find my squad <ArrowRight size={17} />
              </Link>
            </div>

            <div className="hero-note">
              <span><CheckCircle2 size={14} /> verified people</span>
              <span><ShieldCheck size={14} /> encrypted passes</span>
              <span><WalletCards size={14} /> easy split payments</span>
              <span className="hero-route">VI → ONIRU → WUSE II</span>
            </div>
          </div>

          <TiltPass topEvent={topUpcomingEvent} />
        </section>

        {/* Live Ticker */}
        <section className="ticker">
          <div className="ticker-track">
            <span>LAGOS / ABUJA</span><i>✦</i>
            <span>FIND YOUR CREW</span><i>✦</i>
            <span>PAY YOUR SHARE</span><i>✦</i>
            <span>ARRIVE TOGETHER</span><i>✦</i>
            <span>LAGOS / ABUJA</span><i>✦</i>
            <span>FIND YOUR CREW</span><i>✦</i>
          </div>
        </section>

        {/* Section 01: Events Section */}
        <section id="events" className="section-pad events-section">
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
                {label}
              </button>
            ))}
          </div>

          <div className="event-grid">
            {finalEventList.slice(0, 3).map((e, idx) => (
              <EventCard event={e} index={idx} key={e.id || e.title} />
            ))}
          </div>

          <div className="section-foot">
            <span>{finalEventList.length < 10 ? `0${finalEventList.length}` : finalEventList.length} live upcoming events in Lagos & Abuja</span>
            <Link href="/events">
              See all live events <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* Section 02: Squad Section */}
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

        {/* Section 05: Organisers Section */}
        <section id="organisers" className="section-pad organiser-section">
          <div className="organiser-copy">
            <SectionHead
              number="05"
              eyebrow="For the people who make the night"
              title="Your crowd is already looking for you."
              copy="PaddyMeet gives promoters, DJs, venues, and festival teams a direct line to the people who want the next drop."
            />
            <Link className="button button--outline" href="/for-organisers">
              Open organiser studio <ArrowDownRight size={16} />
            </Link>
          </div>

          <div className="studio-grid">
            <div className="studio-card studio-card--wide">
              <div className="studio-card-top">
                <BellRing size={17} />
                <span>FOLLOWER DROP</span>
                <b>LIVE</b>
              </div>
              <strong>2,418</strong>
              <p>people waiting for your next event</p>
              <div className="mini-bars">
                <i /><i /><i /><i /><i /><i /><i /><i /><i />
              </div>
            </div>

            <div className="studio-card">
              <IconBadge tone="gold"><CircleDollarSign size={17} /></IconBadge>
              <strong>₦0 delay</strong>
              <p>automated payouts to Nigerian bank accounts</p>
            </div>

            <div className="studio-card">
              <IconBadge tone="purple"><FileSpreadsheet size={17} /></IconBadge>
              <strong>1 click</strong>
              <p>guest manifest for your gate team</p>
            </div>

            <div className="studio-card studio-card--wide studio-card--sales">
              <div>
                <span>LIVE SALES / GTB · ACCESS · KUDA</span>
                <strong>₦4.82m</strong>
              </div>
              <TrendingUp size={40} />
              <small>+18.4% this week</small>
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
              <Share2Icon />
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
                Explore live events <ArrowRight size={17} />
              </Link>
              <Link className="button button--outline" href="/for-organisers">
                <Plus size={17} /> Host an event
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
            Built for the next good night <span style={{ color: orange }}>ϟ</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
