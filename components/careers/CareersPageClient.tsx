'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDown, ArrowRight, ArrowUpRight, BriefcaseBusiness, Check, ChevronDown,
  Coffee, Compass, Globe2, HeartHandshake, Leaf, Lightbulb, MapPin, Menu,
  Plus, Search, Sparkles, Target, UsersRound, X,
} from 'lucide-react'
import Logo from '@/components/brand/Logo'

interface JobOpening {
  id: string
  title: string
  department: string | null
  location: string | null
  employment_type: string | null
  pay: string | null
  summary: string
  description: string
}

interface Props {
  openings: JobOpening[]
}

const values = [
  ['01', 'Think boldly', 'Start with the real problem on the ground, not just the brief.', Lightbulb],
  ['02', 'Stay curious', 'Ask questions early, and keep learning as the work moves.', Compass],
  ['03', 'Move together', 'Share the context, make decisions in the open, and help each other move.', UsersRound],
  ['04', 'Care deeply', 'Sweat the details people will actually feel on a Friday night.', HeartHandshake],
  ['05', 'Make it matter', 'If it does not help someone get out the door, it does not ship.', Target],
] as const

const benefits = [
  ['Flexible by design', 'Work from the place where you do your clearest thinking.', Globe2],
  ['Room to grow', 'Real ownership, early, with room to grow into it.', Sparkles],
  ['Health, held well', 'Practical support for your health and wellbeing.', Leaf],
  ['Time that is yours', 'Generous time off, and no guilt about taking it.', Coffee],
  ['A fair deal', 'Fair pay for the stage we are at, reviewed as we grow.', BriefcaseBusiness],
  ['Belonging by design', 'A team where different backgrounds and perspectives have room.', HeartHandshake],
  ['Good people, often', 'A small, sharp team that actually likes going out together.', UsersRound],
] as const

const processSteps = [
  ['01', 'Apply', 'Tell us what you’re good at and what you’re curious about.'],
  ['02', 'Meet the team', 'A low-key conversation to get to know each other.'],
  ['03', 'Explore the role', 'A practical session to see how we might work together.'],
  ['04', 'Receive an offer', 'Clarity, care, and no mysterious waiting games.'],
  ['05', 'Start building', 'Your first day should feel like a beginning, not a test.'],
]

const sectionClass = 'mx-auto w-[min(1180px,calc(100%-2rem))]'
const eyebrowClass = 'mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#ff8a52]'
const headingClass = 'font-display font-semibold leading-[.95] tracking-[-.07em]'

export default function CareersPageClient({ openings }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('All departments')
  const [location, setLocation] = useState('All locations')
  const [type, setType] = useState('All types')
  const [selectedRole, setSelectedRole] = useState<JobOpening | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null)
  const dialogCloseRef = useRef<HTMLButtonElement>(null)

  const departments = useMemo(
    () => ['All departments', ...Array.from(new Set(openings.map(o => o.department).filter(Boolean) as string[]))],
    [openings]
  )
  const locations = useMemo(
    () => ['All locations', ...Array.from(new Set(openings.map(o => o.location).filter(Boolean) as string[]))],
    [openings]
  )
  const types = useMemo(
    () => ['All types', ...Array.from(new Set(openings.map(o => o.employment_type).filter(Boolean) as string[]))],
    [openings]
  )

  useEffect(() => {
    if (!mobileOpen) return
    const frame = requestAnimationFrame(() => firstMenuLinkRef.current?.focus())
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        requestAnimationFrame(() => menuButtonRef.current?.focus())
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [mobileOpen])

  useEffect(() => {
    document.body.style.overflow = selectedRole ? 'hidden' : ''
    if (!selectedRole) return
    const frame = requestAnimationFrame(() => dialogCloseRef.current?.focus())
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedRole(null)
      if (event.key !== 'Tab') return
      const dialog = document.querySelector<HTMLDivElement>('[role=dialog]')
      if (!dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = ''
    }
  }, [selectedRole])

  const filteredRoles = useMemo(() => {
    const term = query.trim().toLowerCase()
    return openings.filter((role) => {
      const matchesTerm = !term || [role.title, role.department, role.location, role.summary].some((value) => value?.toLowerCase().includes(term))
      return matchesTerm
        && (department === 'All departments' || role.department === department)
        && (location === 'All locations' || role.location === location)
        && (type === 'All types' || role.employment_type === type)
    })
  }, [openings, query, department, location, type])

  const clearFilters = () => { setQuery(''); setDepartment('All departments'); setLocation('All locations'); setType('All types') }
  const hasFilters = Boolean(query || department !== 'All departments' || location !== 'All locations' || type !== 'All types')
  const scrollToRoles = () => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-screen overflow-hidden bg-[#1a1115] text-[#f7efe4] selection:bg-[#f2a93b] selection:text-[#130c0f]">
      <header className={`${sectionClass} relative z-20 flex items-center justify-between py-5`}>
        <Link href="/" className="flex items-center gap-2">
          <Logo variant="horizontal" tone="reversed" className="h-7 w-auto" />
        </Link>
        <nav className={`${mobileOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-16 flex-col gap-1 border border-white/10 bg-[#251a1c] p-2 shadow-2xl md:static md:flex md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none`} aria-label="Main navigation">
          <a ref={firstMenuLinkRef} href="#why" onClick={() => setMobileOpen(false)} className="border-b border-white/10 px-3 py-3 text-xs font-semibold text-[#b9a8a0] hover:text-[#f7efe4] md:border-0 md:px-0 md:py-0">Why us</a>
          <a href="#culture" onClick={() => setMobileOpen(false)} className="border-b border-white/10 px-3 py-3 text-xs font-semibold text-[#b9a8a0] hover:text-[#f7efe4] md:border-0 md:px-0 md:py-0">Culture</a>
          <a href="#roles" onClick={() => setMobileOpen(false)} className="px-3 py-3 text-xs font-semibold text-[#b9a8a0] hover:text-[#f7efe4] md:px-0 md:py-0">Open roles <span className="ml-1 font-mono text-[10px] text-[#ff5b1e]">{String(openings.length).padStart(2, '0')}</span></a>
        </nav>
        <button onClick={scrollToRoles} className="hidden items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-[#f7efe4] transition hover:border-[#ff5b1e] hover:text-[#ff8a52] md:flex">Join the team <ArrowUpRight size={14} /></button>
        <button ref={menuButtonRef} onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} className="grid size-10 place-items-center text-[#f7efe4] md:hidden">{mobileOpen ? <X /> : <Menu />}</button>
      </header>

      <main id="top">
        <section className={`${sectionClass} grid items-center gap-12 py-20 md:grid-cols-[1fr_.8fr] md:gap-20 md:py-32`}>
          <div>
            <p className={eyebrowClass}><span className="h-px w-6 bg-[#ff5b1e]" /> Join the team <span className="ml-auto text-[#8c7c76]">01 / 07</span></p>
            <h1 className={`${headingClass} max-w-3xl text-[clamp(3.7rem,8vw,7.5rem)]`}>Build what’s<br /><em className="font-serif font-normal not-italic text-[#ff5b1e]">next</em> with us.</h1>
            <p className="mt-8 max-w-md text-base leading-7 text-[#b9a8a0]">We’re a small team building the platform that gets Lagos and Abuja out the door together. We care about how it gets built.</p>
            <div className="mt-9 flex items-center gap-6"><button onClick={scrollToRoles} className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#ff5b1e] px-5 text-xs font-bold text-[#130c0f] shadow-[0_12px_28px_rgba(255,91,30,.18)] transition hover:-translate-y-0.5 hover:bg-[#ff8a52]">View open roles <ArrowRight size={16} /></button><a href="#culture" className="inline-flex items-center gap-2 text-xs font-bold hover:text-[#ff8a52]">Meet the team <ArrowDown size={15} className="text-[#ff5b1e]" /></a></div>
          </div>
          <div role="img" aria-label="Abstract illustration representing ideas connecting across a team" className="relative min-h-[420px] md:min-h-[500px]">
            <div className="absolute inset-[17%_6%_7%] rounded-full bg-[radial-gradient(circle,rgba(255,91,30,.2),transparent_58%)] blur-xl" />
            <div className="absolute left-1/2 top-[43%] grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#ff5b1e] text-5xl text-[#130c0f] shadow-[0_0_0_14px_rgba(255,91,30,.09),0_0_90px_rgba(255,91,30,.32)]">+</div>
            {['-rotate-[32deg] h-[37%] w-[80%] border-[#f2a93b]/30', 'rotate-[58deg] h-[65%] w-[56%] border-[#ff5b1e]/25', 'rotate-[8deg] h-[57%] w-[91%] border-white/10'].map((className) => <div key={className} className={`absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border ${className}`} />)}
            <div className="absolute left-0 top-[5%] font-mono text-[10px] uppercase leading-5 tracking-wider text-[#8c7c76]">Notes from the<br /><strong className="font-normal text-[#f7efe4]">studio.</strong></div>
            <div className="absolute right-0 top-[10%] flex min-h-[215px] w-44 rotate-2 flex-col border border-white/20 bg-[#251a1c]/95 p-5 shadow-2xl backdrop-blur"><span className="font-mono text-[9px] uppercase tracking-wider text-[#8c7c76]">TEAM NOTES / 01</span><strong className="mt-auto font-display text-2xl leading-none tracking-[-.06em]">Make it<br />real.<br /><em className="font-serif font-normal not-italic text-[#ff5b1e]">Make it safe.</em></strong><span className="mt-4 grid size-7 place-items-center self-end rounded-full bg-[#ff5b1e] text-[#130c0f]"><ArrowUpRight size={15} /></span></div>
            <div className="absolute bottom-[10%] left-0 flex min-h-24 w-40 -rotate-2 flex-col border border-white/20 bg-[#251a1c]/95 p-4 shadow-2xl backdrop-blur"><span className="font-mono text-[9px] uppercase tracking-wider text-[#8c7c76]">EXPLORE</span><strong className="font-display text-4xl tracking-[-.08em] text-[#f2a93b]">2</strong><span className="text-xs text-[#b9a8a0]">cities, and growing</span></div>
            <div className="absolute bottom-0 right-0 font-mono text-[10px] uppercase tracking-wider text-[#ff8a52]">01 — work in progress</div>
          </div>
        </section>

        <div className="-rotate-1 scale-[1.02] overflow-hidden bg-[#f2a93b] py-4 text-[#130c0f]"><div className="flex w-max items-center gap-8 whitespace-nowrap font-mono text-[11px] tracking-[.15em]"><span>WORK WITH INTENTION</span><span>✳</span><span>STAY CURIOUS</span><span>✳</span><span>MAKE GOOD THINGS</span><span>✳</span><span>WORK WITH INTENTION</span><span>✳</span></div></div>

        <section id="why" className={`${sectionClass} grid gap-6 py-28 md:grid-cols-[70px_1fr_220px] md:gap-8 md:py-40`}>
          <div className="flex items-center gap-3 font-mono text-[10px] text-[#ff5b1e]"><span>02</span><span className="h-px w-6 bg-[#ff5b1e]" /></div>
          <div className="max-w-2xl"><p className={eyebrowClass}>A different kind of company</p><h2 className={`${headingClass} text-5xl md:text-7xl`}>Do your best work with people who <em className="font-serif font-normal not-italic text-[#ff5b1e]">care.</em></h2><div className="mt-8 grid gap-6 text-sm leading-7 text-[#b9a8a0] md:grid-cols-2"><p>The best work happens when people have room to think, trust to try, and enough time to get the details right.</p><p>We keep the team small, the work close, and the conversation honest. You’ll know what you’re working on, why it matters, and who is in the room.</p></div><a href="#culture" className="mt-8 inline-flex items-center gap-2 border-b border-white/20 pb-2 text-xs font-bold hover:text-[#ff8a52]">See how we work <ArrowUpRight size={14} className="text-[#ff5b1e]" /></a></div>
          <div className="grid size-40 place-items-center self-end justify-self-start rounded-full border border-[#f2a93b] text-center font-mono text-xs leading-4 text-[#f2a93b] md:justify-self-end"><span>GOOD<br />WORK<br /><em className="font-serif text-base not-italic text-[#ff5b1e]">TAKES</em><br />CARE</span></div>
        </section>

        <section id="culture" className={`${sectionClass} py-20 md:py-32`}>
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className={eyebrowClass}>03 / The way we work</p><h2 className={`${headingClass} text-5xl md:text-7xl`}>How we <em className="font-serif font-normal not-italic text-[#ff5b1e]">work.</em></h2></div><p className="max-w-xs text-sm leading-6 text-[#b9a8a0]">A few simple rules for doing good work together, without making work the whole of the night.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{values.map(([number, title, copy, Icon]) => <article key={title} className="group relative min-h-64 border border-white/10 bg-[#251a1c] p-5 transition hover:-translate-y-1 hover:border-[#ff5b1e]/60 hover:bg-[#2d1c1e]"><div className="flex items-center justify-between text-[#ff5b1e]"><span className="font-mono text-[10px] text-[#8c7c76]">{number}</span><Icon size={20} strokeWidth={1.6} /></div><h3 className="mt-16 font-display text-lg font-semibold tracking-tight">{title}</h3><p className="mt-3 text-xs leading-5 text-[#b9a8a0]">{copy}</p><span className="absolute bottom-5 right-5 grid size-6 place-items-center rounded-full border border-[#ff5b1e] text-[#ff5b1e] transition group-hover:rotate-90 group-hover:bg-[#ff5b1e] group-hover:text-[#130c0f]"><Plus size={14} /></span></article>)}</div>
        </section>

        <section className={`${sectionClass} grid gap-12 border-t border-white/10 py-24 md:grid-cols-[.72fr_1.28fr] md:gap-24 md:py-36`}>
          <div><p className={eyebrowClass}>04 / The good stuff</p><h2 className={`${headingClass} text-5xl md:text-7xl`}>Everything you need to do <em className="font-serif font-normal not-italic text-[#ff5b1e]">meaningful</em> work.</h2><p className="mt-8 max-w-xs text-sm leading-7 text-[#b9a8a0]">We take care of the foundations so you can focus on the work that brought you here.</p></div>
          <div className="grid gap-x-10 sm:grid-cols-2">{benefits.map(([title, copy, Icon]) => <div key={title} className="flex gap-4 border-t border-white/10 py-5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#ff5b1e]/10 text-[#ff5b1e]"><Icon size={18} /></span><div><h3 className="font-display text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-[#b9a8a0]">{copy}</p></div></div>)}</div>
        </section>

        <section id="roles" className={`${sectionClass} border-t border-white/10 py-24 md:py-32`}>
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className={eyebrowClass}>05 / Open positions</p><h2 className={`${headingClass} max-w-2xl text-5xl md:text-7xl`}>Find your next <em className="font-serif font-normal not-italic text-[#ff5b1e]">opportunity.</em></h2></div><p className="max-w-xs text-sm leading-6 text-[#b9a8a0]">We’re hiring people who want to do solid work with a small, fast-moving team.</p></div>

          {openings.length === 0 ? (
            <div className="border border-white/10 bg-[#251a1c]/60 px-5 py-16 text-center"><BriefcaseBusiness className="mx-auto text-[#ff5b1e]" size={20} /><h3 className="mt-4 font-display text-xl">No open roles right now.</h3><p className="mx-auto mt-2 max-w-sm text-sm text-[#b9a8a0]">We don’t have anything open at the moment, but we’re always glad to hear from people who care about nightlife, technology, and building for Nigeria.</p><a href="mailto:careers@paddymeet.com" className="mt-5 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold hover:border-[#ff5b1e]">Send Us Your CV</a></div>
          ) : (
            <>
              <div className="grid gap-2 md:grid-cols-[1.6fr_repeat(3,.72fr)]">
                <label className="flex min-h-12 items-center gap-3 border border-white/10 bg-[#251a1c] px-4 text-[#8c7c76] md:col-span-1"><Search size={17} /><span className="sr-only">Search open roles</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles, skills, or keywords" className="w-full bg-transparent text-xs text-[#f7efe4] outline-none placeholder:text-[#8c7c76]" /></label>
                <label className="relative flex min-h-12 items-center border border-white/10 bg-[#251a1c] text-[#b9a8a0]"><span className="sr-only">Filter by department</span><select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-12 w-full appearance-none bg-transparent px-4 pr-9 text-xs outline-none">{departments.map(d => <option key={d} className="bg-[#1a1115]">{d}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3" /></label>
                <label className="relative flex min-h-12 items-center border border-white/10 bg-[#251a1c] text-[#b9a8a0]"><span className="sr-only">Filter by location</span><select value={location} onChange={(event) => setLocation(event.target.value)} className="h-12 w-full appearance-none bg-transparent px-4 pr-9 text-xs outline-none">{locations.map(l => <option key={l} className="bg-[#1a1115]">{l}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3" /></label>
                <label className="relative flex min-h-12 items-center border border-white/10 bg-[#251a1c] text-[#b9a8a0]"><span className="sr-only">Filter by employment type</span><select value={type} onChange={(event) => setType(event.target.value)} className="h-12 w-full appearance-none bg-transparent px-4 pr-9 text-xs outline-none">{types.map(t => <option key={t} className="bg-[#1a1115]">{t}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3" /></label>
              </div>
              {hasFilters && <button onClick={clearFilters} className="mt-3 inline-flex items-center gap-1 text-xs text-[#ff8a52] hover:text-[#f7efe4]">Clear filters <X size={13} /></button>}
              <div className="my-6 flex justify-between font-mono text-[10px] uppercase tracking-wider text-[#8c7c76]"><span><strong className="text-sm text-[#f7efe4]">{String(filteredRoles.length).padStart(2, '0')}</strong> roles open now</span><span className="hidden items-center gap-2 sm:flex"><span className="size-1.5 rounded-full bg-green-400" /> We reply to every application</span></div>
              <div aria-live="polite">
                {filteredRoles.map((role, index) => (
                  <button key={role.id} onClick={() => setSelectedRole(role)} className="group grid w-full grid-cols-[28px_1fr_22px] gap-3 border-t border-white/10 py-5 text-left transition hover:bg-[#251a1c] md:grid-cols-[45px_1fr_180px_105px] md:gap-5 md:px-3">
                    <span className="font-mono text-[10px] text-[#ff5b1e]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="min-w-0"><strong className="block font-display text-sm tracking-tight">{role.title}</strong><span className="mt-1 block text-xs leading-5 text-[#b9a8a0]">{role.summary}</span></span>
                    <span className="hidden flex-col gap-1 text-[11px] text-[#b9a8a0] md:flex">{role.location && <span className="flex items-center gap-1"><MapPin size={13} className="text-[#ff8a52]" />{role.location}</span>}{role.employment_type && <span className="flex items-center gap-1"><BriefcaseBusiness size={13} className="text-[#ff8a52]" />{role.employment_type}</span>}</span>
                    <span className="flex items-center justify-end text-[#ff8a52]"><span className="hidden text-[11px] font-bold md:inline">View role</span><ArrowUpRight size={17} className="transition group-hover:-translate-y-1 group-hover:translate-x-1" /></span>
                  </button>
                ))}
                {!filteredRoles.length && <div className="border border-white/10 bg-[#251a1c]/60 px-5 py-16 text-center"><Search className="mx-auto text-[#ff5b1e]" size={20} /><h3 className="mt-4 font-display text-xl">No roles in that search.</h3><p className="mt-2 text-sm text-[#b9a8a0]">Try a different search or clear the filters.</p><button onClick={clearFilters} className="mt-5 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold hover:border-[#ff5b1e]">Clear filters</button></div>}
              </div>
            </>
          )}
        </section>

        <section className={`${sectionClass} grid gap-12 border-t border-white/10 py-24 md:grid-cols-[.8fr_1.2fr] md:gap-24 md:py-36`}>
          <div><p className={eyebrowClass}>06 / How it works</p><h2 className={`${headingClass} text-5xl md:text-7xl`}>A straightforward <em className="font-serif font-normal not-italic text-[#ff5b1e]">process.</em></h2><p className="mt-8 max-w-xs text-sm leading-7 text-[#b9a8a0]">We’ll tell you what to expect, keep you updated, and leave room for your questions.</p></div>
          <div>{processSteps.map(([number, title, copy]) => <div key={number} className="grid min-h-24 grid-cols-[35px_1px_1fr_18px] gap-4"><span className="font-mono text-[10px] text-[#ff5b1e]">{number}</span><span className="bg-white/15" /><div><h3 className="font-display text-base font-semibold">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-[#b9a8a0]">{copy}</p></div><Check size={16} className="text-[#8c7c76]" /></div>)}</div>
        </section>

        <section className={`${sectionClass} max-w-4xl py-20 text-center md:py-32`}><div className="font-serif text-7xl leading-none text-[#ff5b1e]">&ldquo;</div><blockquote className="mt-6 font-display text-3xl font-medium leading-tight tracking-[-.06em] md:text-5xl">The best part of working here is being trusted to do ambitious work with people who genuinely care about the outcome.</blockquote><div className="mt-8 inline-flex items-center gap-3 text-left"><span className="grid size-10 place-items-center rounded-full bg-[#f2a93b] font-mono text-[9px] text-[#130c0f]">PM</span><span><strong className="block text-xs">The PaddyMeet team</strong></span></div></section>

        <section className={`${sectionClass} relative overflow-hidden border border-white/10 bg-[#130c0f] px-6 py-24 text-center md:px-20 md:py-32`}><div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full border border-[#ff5b1e]/20 shadow-[0_0_0_40px_rgba(255,91,30,.03),0_0_0_80px_rgba(255,91,30,.02)]" /><div className="pointer-events-none absolute -bottom-32 -right-24 size-72 rounded-full border border-[#f2a93b]/15" /><p className={`${eyebrowClass} relative justify-center`}>07 / Your move</p><h2 className={`${headingClass} relative text-5xl md:text-7xl`}>Your next chapter<br />could start <em className="font-serif font-normal not-italic text-[#ff5b1e]">here.</em></h2><p className="relative mx-auto mt-7 max-w-md text-sm leading-7 text-[#b9a8a0]">Tell us what you’ve been working on. We’ll tell you what we’re building.</p><button onClick={scrollToRoles} className="relative mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#ff5b1e] px-5 text-xs font-bold text-[#130c0f] transition hover:-translate-y-0.5 hover:bg-[#ff8a52]">Explore open roles <ArrowRight size={16} /></button><span className="relative mt-5 block font-mono text-[9px] text-[#8c7c76]">No perfect CV required. Just a clear one.</span></section>
      </main>

      <footer className={`${sectionClass} grid gap-12 py-20 md:grid-cols-2`}>
        <div>
          <Link href="/" className="inline-block"><Logo variant="horizontal" tone="reversed" className="h-6 w-auto" /></Link>
          <p className="mt-6 font-display text-xl leading-tight tracking-tight text-[#b9a8a0]">Good nights.<br />Built together.</p>
        </div>
        <div className="flex gap-16 md:justify-end">
          <div className="flex flex-col gap-3"><span className="font-mono text-[10px] uppercase tracking-wider text-[#ff8a52]">Explore</span><a href="#why" className="text-xs text-[#b9a8a0] hover:text-[#f7efe4]">Why us</a><a href="#culture" className="text-xs text-[#b9a8a0] hover:text-[#f7efe4]">Culture</a><a href="#roles" className="text-xs text-[#b9a8a0] hover:text-[#f7efe4]">Open roles</a></div>
          <div className="flex flex-col gap-3"><span className="font-mono text-[10px] uppercase tracking-wider text-[#ff8a52]">Say hello</span><a href="mailto:careers@paddymeet.com" className="text-xs text-[#b9a8a0] hover:text-[#f7efe4]">careers@paddymeet.com</a></div>
        </div>
        <div className="col-span-full flex flex-col gap-2 border-t border-white/10 pt-5 font-mono text-[9px] text-[#8c7c76] sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} Paddymeet</span><span>Built with care in Lagos <span className="text-[#ff5b1e]">✳</span></span></div>
      </footer>

      {selectedRole && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#130c0f]/80 p-4 backdrop-blur" onMouseDown={(event) => event.target === event.currentTarget && setSelectedRole(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="role-title" aria-describedby="role-description" className="relative max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto border border-white/20 bg-[#251a1c] p-8 shadow-2xl md:p-12">
            <button ref={dialogCloseRef} onClick={() => setSelectedRole(null)} aria-label="Close role details" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/10 text-[#b9a8a0] hover:border-[#ff5b1e] hover:text-[#ff5b1e]"><X size={18} /></button>
            <p className={eyebrowClass}>{[selectedRole.department, selectedRole.employment_type].filter(Boolean).join(' · ')}</p>
            <h2 id="role-title" className={`${headingClass} text-4xl md:text-5xl`}>{selectedRole.title}</h2>
            {selectedRole.location && <p className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase text-[#ff8a52]"><MapPin size={14} /> {selectedRole.location}</p>}
            <p id="role-description" className="mt-8 whitespace-pre-line text-sm leading-7 text-[#b9a8a0]">{selectedRole.description}</p>
            {selectedRole.pay && (
              <div className="mt-7 border border-white/10 p-5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8c7c76]">Pay</span>
                <p className="mt-2 text-sm text-[#f7efe4]">{selectedRole.pay}</p>
              </div>
            )}
            <Link href={`/careers/${selectedRole.id}`} className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#ff5b1e] px-5 text-xs font-bold text-[#130c0f] hover:bg-[#ff8a52]">Start an application <ArrowUpRight size={16} /></Link>
            <p className="mt-4 font-mono text-[9px] text-[#8c7c76]">We review every application with care.</p>
          </div>
        </div>
      )}
    </div>
  )
}
