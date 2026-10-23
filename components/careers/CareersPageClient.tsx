'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight, ArrowUpRight, Briefcase, Check, Compass, Coffee, Globe2,
  HeartHandshake, Lightbulb, MapPin, Search, ShieldCheck, Sparkles,
  Target, UsersRound, X, type LucideIcon,
} from 'lucide-react'
import Logo from '@/components/brand/Logo'

interface JobOpening {
  id: string
  title: string
  department: string | null
  location: string | null
  employment_type: string | null
  summary: string
}

interface Props {
  openings: JobOpening[]
}

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

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff8a52] mb-3">
      <span className="w-4 h-px bg-[#ff5b1e]" />
      {children}
    </div>
  )
}

const values: { title: string; copy: string; icon: LucideIcon }[] = [
  { title: 'Think boldly', copy: 'Start with the real problem on the ground, not just the brief.', icon: Lightbulb },
  { title: 'Stay curious', copy: 'Ask questions early, and keep learning as the work moves.', icon: Compass },
  { title: 'Move together', copy: 'Share context, make decisions in the open, and help each other move fast.', icon: UsersRound },
  { title: 'Care deeply', copy: 'Sweat the details people will actually feel on a Friday night.', icon: HeartHandshake },
  { title: 'Make it matter', copy: 'If it does not help someone get out the door safely, it does not ship.', icon: Target },
]

const benefits: { title: string; copy: string; icon: LucideIcon }[] = [
  { title: 'Flexible by design', copy: 'Work from wherever you do your clearest thinking.', icon: Globe2 },
  { title: 'Room to grow', copy: 'Real ownership, early, with room to grow into it.', icon: Sparkles },
  { title: 'Health, held well', copy: 'Practical support for your health and wellbeing.', icon: HeartHandshake },
  { title: 'Time that is yours', copy: 'Generous time off, and no guilt about taking it.', icon: Coffee },
  { title: 'A fair deal', copy: 'Fair pay for the stage we are at, reviewed as we grow.', icon: Briefcase },
  { title: 'Belonging by design', copy: 'A team where different backgrounds and perspectives have room.', icon: ShieldCheck },
  { title: 'Good people, often', copy: 'A small, sharp team that actually likes going out together.', icon: UsersRound },
]

const processSteps: [string, string, string][] = [
  ['01', 'Apply', 'Tell us what you are good at and what you are curious about.'],
  ['02', 'Meet the team', 'A low-key conversation to get to know each other.'],
  ['03', 'Explore the role', 'A practical session to see how we might work together.'],
  ['04', 'Receive an offer', 'Clarity and care, no mysterious waiting games.'],
  ['05', 'Start building', 'Your first day should feel like a beginning, not a test.'],
]

export default function CareersPageClient({ openings }: Props) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('All departments')
  const [location, setLocation] = useState('All locations')

  const departments = useMemo(
    () => ['All departments', ...Array.from(new Set(openings.map(o => o.department).filter(Boolean) as string[]))],
    [openings]
  )
  const locations = useMemo(
    () => ['All locations', ...Array.from(new Set(openings.map(o => o.location).filter(Boolean) as string[]))],
    [openings]
  )

  const filteredOpenings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return openings.filter(o => {
      const matchesQuery = !normalizedQuery || [o.title, o.department, o.location, o.summary].some(v => v?.toLowerCase().includes(normalizedQuery))
      const matchesDept = department === 'All departments' || o.department === department
      const matchesLocation = location === 'All locations' || o.location === location
      return matchesQuery && matchesDept && matchesLocation
    })
  }, [openings, query, department, location])

  const hasFilters = query || department !== 'All departments' || location !== 'All locations'
  const clearFilters = () => { setQuery(''); setDepartment('All departments'); setLocation('All locations') }

  const scrollToRoles = () => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="pm-page pm-atmosphere min-h-screen">
      <div className="pm-grain" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo variant="horizontal" tone="reversed" className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <a href="#why" className="hidden sm:inline text-[13px] font-semibold text-[#b9a8a0] hover:text-[#f7efe4] transition-colors">Why us</a>
          <a href="#roles" className="hidden sm:inline text-[13px] font-semibold text-[#b9a8a0] hover:text-[#f7efe4] transition-colors">Open roles</a>
          <Link href="/" className="pm-btn pm-btn--outline text-[12.5px] px-4 py-2">Back to PaddyMeet</Link>
        </div>
      </nav>

      <main className="pt-16">

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-20 pb-16 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[var(--pm-border)] text-xs font-semibold text-[#ff8a52] uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Join the team
            </div>
            <h1 className="pm-serif text-[clamp(36px,6vw,64px)] leading-[1.05] tracking-tight mb-5">
              Build what&apos;s next for<br /><em className="text-[#ff8a52] not-italic">Nigerian nightlife.</em>
            </h1>
            <p className="text-sm sm:text-base text-[#b9a8a0] max-w-xl mx-auto leading-relaxed mb-8">
              We&apos;re a small team building the platform that gets Lagos and Abuja out the door together, safely and anonymously. If you care about nightlife, trust, and building fast — we want to hear from you.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button onClick={scrollToRoles} className="pm-btn pm-btn--primary text-sm px-6 py-3.5">
                View open roles <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#why" className="pm-btn pm-btn--ghost text-sm px-4 py-3.5">Meet the team</a>
            </div>
          </Reveal>
        </section>

        {/* Principles marquee */}
        <section className="py-5 border-y border-[var(--pm-border)] overflow-hidden" aria-label="Company principles">
          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-[0.2em] text-[#8c7c76] whitespace-nowrap">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className="flex items-center gap-6 flex-shrink-0">
                <span>Verified profiles</span><i className="text-[#ff5b1e]">✳</i>
                <span>Safe and anonymous</span><i className="text-[#ff5b1e]">✳</i>
                <span>Built for Lagos</span><i className="text-[#ff5b1e]">✳</i>
                <span>Move fast</span><i className="text-[#ff5b1e]">✳</i>
              </span>
            ))}
          </div>
        </section>

        {/* Why us */}
        <section id="why" className="max-w-5xl mx-auto px-5 sm:px-8 py-20">
          <Reveal className="max-w-2xl mx-auto text-center mb-14">
            <SectionEyebrow>A different kind of company</SectionEyebrow>
            <h2 className="pm-serif text-[clamp(26px,4vw,38px)] leading-tight tracking-tight mx-auto">
              Do your best work with people who <em className="text-[#ff8a52] not-italic">care.</em>
            </h2>
            <p className="text-sm text-[#b9a8a0] mt-4 leading-relaxed">
              We&apos;re building the infrastructure for how people actually go out — meaningful work, high standards, and a lot of creative problem-solving, done together.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {values.map((v, i) => {
              const Icon = v.icon
              return (
                <Reveal key={v.title} delay={i * 0.05} className="pm-card p-5">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(255,91,30,0.12)] text-[#ff8a52] flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#f7efe4] mb-1.5">{v.title}</h3>
                  <p className="text-xs text-[#b9a8a0] leading-relaxed">{v.copy}</p>
                </Reveal>
              )
            })}
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-20">
          <Reveal className="max-w-xl mb-10">
            <SectionEyebrow>What you get</SectionEyebrow>
            <h2 className="pm-serif text-[clamp(26px,4vw,38px)] leading-tight tracking-tight">
              Everything you need to do meaningful work.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b, i) => {
              const Icon = b.icon
              return (
                <Reveal key={b.title} delay={i * 0.04} className="pm-card-soft p-5">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.06)] text-[#ff8a52] flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#f7efe4] mb-1.5">{b.title}</h3>
                  <p className="text-xs text-[#b9a8a0] leading-relaxed">{b.copy}</p>
                </Reveal>
              )
            })}
          </div>
        </section>

        {/* Open roles */}
        <section id="roles" className="max-w-5xl mx-auto px-5 sm:px-8 py-20">
          <Reveal className="max-w-xl mb-8">
            <SectionEyebrow>Open roles</SectionEyebrow>
            <h2 className="pm-serif text-[clamp(26px,4vw,38px)] leading-tight tracking-tight">
              Find your next opportunity.
            </h2>
          </Reveal>

          {openings.length > 0 && (
            <Reveal delay={0.1} className="flex flex-wrap items-center gap-2 mb-8">
              <div className="flex items-center gap-2 px-4 py-2.5 pm-card-soft rounded-full flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[#8c7c76] flex-shrink-0" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search roles..."
                  className="bg-transparent border-none outline-none text-sm text-[#f7efe4] w-full placeholder:text-[#8c7c76]"
                />
              </div>
              <select value={department} onChange={e => setDepartment(e.target.value)} className="px-4 py-2.5 pm-card-soft rounded-full text-xs font-semibold text-[#f7efe4] outline-none cursor-pointer">
                {departments.map(d => <option key={d} value={d} className="bg-[#1a1115]">{d}</option>)}
              </select>
              <select value={location} onChange={e => setLocation(e.target.value)} className="px-4 py-2.5 pm-card-soft rounded-full text-xs font-semibold text-[#f7efe4] outline-none cursor-pointer">
                {locations.map(l => <option key={l} value={l} className="bg-[#1a1115]">{l}</option>)}
              </select>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-bold text-[#ff8a52] hover:underline px-2">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </Reveal>
          )}

          {openings.length === 0 ? (
            <Reveal className="pm-card p-8 sm:p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(255,91,30,0.12)] flex items-center justify-center mx-auto mb-5">
                <Briefcase className="w-6 h-6 text-[#ff8a52]" />
              </div>
              <h3 className="text-lg font-extrabold text-[#f7efe4] mb-2">No open roles right now</h3>
              <p className="text-sm text-[#b9a8a0] leading-relaxed max-w-md mx-auto mb-6">
                We don&apos;t have anything open at the moment, but we&apos;re always glad to hear from people who care about nightlife, technology, and building for Nigeria.
              </p>
              <a href="mailto:careers@paddymeet.com" className="pm-btn pm-btn--primary text-sm px-6 py-3">
                Send Us Your CV
              </a>
            </Reveal>
          ) : filteredOpenings.length === 0 ? (
            <Reveal className="pm-card p-10 text-center">
              <p className="text-sm text-[#b9a8a0]">No roles match those filters.</p>
              <button onClick={clearFilters} className="text-xs font-bold text-[#ff8a52] hover:underline mt-2">Clear filters</button>
            </Reveal>
          ) : (
            <div className="space-y-3">
              {filteredOpenings.map((role, i) => (
                <Reveal key={role.id} delay={i * 0.04}>
                  <Link href={`/careers/${role.id}`} className="pm-card flex items-center justify-between gap-4 p-5 hover:border-[rgba(255,91,30,0.4)] transition-colors group">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="text-sm font-bold text-[#f7efe4]">{role.title}</h3>
                        {role.employment_type && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(255,255,255,0.06)] text-[#b9a8a0] border border-[var(--pm-border)]">{role.employment_type}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#8c7c76] mb-2 line-clamp-1">{role.summary}</p>
                      <div className="flex items-center gap-3 text-[11px] text-[#b9a8a0]">
                        {role.department && <span>{role.department}</span>}
                        {role.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{role.location}</span>}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#ff8a52] flex-shrink-0 group-hover:gap-2 transition-all">
                      View role <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </section>

        {/* Hiring process */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-20">
          <Reveal className="max-w-xl mb-12">
            <SectionEyebrow>How it works</SectionEyebrow>
            <h2 className="pm-serif text-[clamp(26px,4vw,38px)] leading-tight tracking-tight">
              Our hiring process.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {processSteps.map(([num, title, copy], i) => (
              <Reveal key={num} delay={i * 0.06} className="relative">
                <div className="text-3xl font-extrabold text-[rgba(255,255,255,0.08)] pm-serif mb-2">{num}</div>
                <h3 className="text-sm font-bold text-[#f7efe4] mb-1.5">{title}</h3>
                <p className="text-xs text-[#b9a8a0] leading-relaxed">{copy}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 px-5 sm:px-8 text-center overflow-hidden" style={{ background: 'var(--pm-bg-deep)' }}>
          <Reveal className="max-w-2xl mx-auto relative z-10">
            <h2 className="pm-serif text-[clamp(28px,5vw,46px)] leading-tight tracking-tight mb-5">
              Your next chapter could start here.
            </h2>
            <p className="text-sm text-[#b9a8a0] mb-8 max-w-md mx-auto leading-relaxed">
              Take a look at what&apos;s open, or send us your CV so we know you exist when the right role comes up.
            </p>
            <button onClick={scrollToRoles} className="pm-btn pm-btn--primary text-sm px-7 py-3.5">
              Explore open roles <ArrowRight className="w-4 h-4" />
            </button>
          </Reveal>
        </section>

        <footer className="px-5 sm:px-8 py-8 border-t border-[var(--pm-border)]" style={{ background: 'var(--pm-bg-deep)' }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <Logo variant="horizontal" tone="reversed" className="h-6 w-auto" />
            <div className="flex items-center gap-2 text-xs text-[#8c7c76]">
              <Check className="w-3.5 h-3.5 text-[#ff8a52]" /> © {new Date().getFullYear()} Paddymeet
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
