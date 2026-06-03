import SupportChat from '@/components/SupportChat'
import Link from 'next/link'
import { ArrowRight, MapPin, Users, Star, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check account type
  let dashboardUrl = '/dashboard'
  if (user) {
    const { data: organiser } = await supabase
      .from('organisers')
      .select('id')
      .eq('id', user.id)
      .single()
    if (organiser) dashboardUrl = '/organiser/dashboard'
  }

  const events = [
    { id: 1, title: 'Lagos Music Festival 2025', category: 'Festival', location: 'Eko Hotel Grounds, VI', date: 'Sat 14 Jun', vibe: 'Turnt', going: 94, groups: true, gradient: 'from-purple-900 via-pink-900 to-orange-900' },
    { id: 2, title: 'Sunday Sip & Vibe', category: 'Day Party', location: 'Landmark Beach, VI', date: 'Sun 15 Jun', vibe: 'Chill', going: 28, groups: true, gradient: 'from-green-900 via-teal-900 to-blue-900' },
    { id: 3, title: 'Eko Arts Weekend', category: 'Arts', location: 'Terra Kulture, VI', date: 'Sat–Sun 14–15 Jun', vibe: 'Cultural', going: 12, groups: false, free: true, gradient: 'from-indigo-900 via-purple-900 to-pink-900' },
    { id: 4, title: 'Midnight Rave Edition', category: 'Club Night', location: 'Lekki Phase 1', date: 'Fri 20 Jun', vibe: 'Wild', going: 47, groups: true, gradient: 'from-orange-900 via-red-900 to-pink-900' },
    { id: 5, title: 'Burna & Friends Live', category: 'Concert', location: 'Tafawa Balewa Square', date: 'Sat 21 Jun', vibe: 'Exclusive', going: 214, groups: false, gradient: 'from-blue-900 via-indigo-900 to-purple-900' },
    { id: 6, title: 'Ikoyi Rooftop Sundays', category: 'Lounge', location: 'Ikoyi Club Grounds', date: 'Sun 22 Jun', vibe: 'Social', going: 33, groups: true, gradient: 'from-green-900 via-emerald-900 to-teal-900' },
  ]

  const vibes = ['Afrobeats', 'Chill', 'Exclusive', 'Amapiano', 'Comedy', 'Day Party', 'Wild', 'Concert', 'Cocktail Night', 'Rooftop', 'Festival', 'Rave']

  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-10 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/events" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Events</Link>
          <Link href="/signup" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">How It Works</Link>
          <Link href="/signup" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">About</Link>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href={dashboardUrl} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-200">
              My Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-200">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen pt-16 relative overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-white">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-radial from-orange-100/40 to-transparent -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-radial from-orange-50/60 to-transparent translate-y-1/4 -translate-x-1/4 pointer-events-none" />

        <div className="max-width-container mx-auto px-6 md:px-10 pt-16 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-128px)]">

            {/* Left */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-full text-xs font-bold text-orange-500 uppercase tracking-wider mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                Now live in Lagos
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.05] mb-6">
                Your next<br />
                <span className="text-orange-500 italic">night out</span><br />
                <span className="text-gray-400 font-normal italic">starts here.</span>
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-md">
                Discover events, join groups of like-minded people, coordinate together, and arrive as a crew — safely and anonymously.
              </p>

              <div className="flex items-center gap-4 mb-12 flex-wrap">
                {user ? (
                  <>
                    <Link href="/events" className="flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all hover:shadow-xl hover:shadow-orange-200 hover:-translate-y-0.5">
                      Browse Events <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href={dashboardUrl} className="px-8 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-orange-300 hover:text-orange-500 transition-all">
                      My Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/signup" className="flex items-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all hover:shadow-xl hover:shadow-orange-200 hover:-translate-y-0.5">
                      Find Events Near Me <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/events" className="px-8 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-orange-300 hover:text-orange-500 transition-all">
                      Browse Events
                    </Link>
                  </>
                )}
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4">
                <div className="flex">
                  {['bg-orange-400','bg-pink-500','bg-purple-500','bg-blue-500','bg-green-500'].map((color, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full ${color} border-2 border-white -ml-2 first:ml-0 flex items-center justify-center text-white text-xs font-bold`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-orange-400 text-sm">★★★★★</div>
                  <div className="text-sm text-gray-500">Loved by <strong className="text-gray-900">2,400+ people</strong> across Lagos</div>
                </div>
              </div>
            </div>

            {/* Right — floating cards */}
            <div className="relative h-[540px] hidden lg:block">
              <div className="absolute top-4 right-8 bg-white rounded-2xl p-3 shadow-xl border border-gray-100 flex items-center gap-3 z-20 animate-float-slow">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Verified</div>
                  <div className="text-xs text-gray-500">Safe and anonymous</div>
                </div>
              </div>

              <div className="absolute top-16 left-1/2 -translate-x-1/2 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-float-medium">
                <div className={`h-40 bg-gradient-to-br ${events[0].gradient} relative flex items-end p-4`}>
                  <span className="relative z-10 px-3 py-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs font-bold text-white uppercase tracking-wider">Trending</span>
                </div>
                <div className="p-4">
                  <div className="font-bold text-gray-900 mb-1">{events[0].title}</div>
                  <div className="text-xs text-gray-500 mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" /> {events[0].location}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {['bg-orange-400','bg-pink-500','bg-purple-500'].map((c,i) => (
                          <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-white -ml-1.5 first:ml-0`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">+{events[0].going}</span>
                    </div>
                    <Link href="/events" className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-full hover:bg-orange-600 transition-colors">
                      Get Tickets
                    </Link>
                  </div>
                </div>
              </div>

              <div className="absolute top-12 left-0 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-20 animate-float-fast">
                <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Day Party</div>
                <div className="text-sm font-bold text-gray-900 mb-1">Sunday Sip & Vibe</div>
                <div className="text-xs text-gray-500 mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" /> Landmark Beach</div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Groups open
                </div>
              </div>

              <div className="absolute top-48 right-0 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-20 animate-float-slow">
                <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Comedy</div>
                <div className="text-sm font-bold text-gray-900 mb-1">Lagos Laughs Out Loud</div>
                <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Federal Palace</div>
              </div>

              <div className="absolute bottom-24 left-4 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-20 animate-float-medium">
                <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Exclusive</div>
                <div className="text-sm font-bold text-gray-900 mb-1">VIP Rooftop VI</div>
                <div className="text-xs text-orange-500 font-bold flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  4 spots left
                </div>
              </div>

              <div className="absolute bottom-32 right-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-3 flex items-center gap-3 z-20 animate-float-fast">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">3 groups forming</div>
                  <div className="text-xs text-gray-500">for this weekend</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WAVE DIVIDER */}
      <div className="w-full overflow-hidden -mt-1 bg-gray-50">
        <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none" style={{height:'60px'}}>
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,0 L0,0 Z" fill="white"/>
        </svg>
      </div>

      {/* EVENTS SECTION */}
      <section className="bg-gray-50 py-20 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">Happening Near You</div>
              <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Events in <span className="text-orange-500">Lagos</span></h2>
              <p className="text-gray-500 mt-2">Tap any event to see full details and join a group</p>
            </div>
            <Link href="/events" className="hidden md:flex items-center gap-2 text-sm font-bold text-orange-500 hover:gap-3 transition-all">
              See all events <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1 md:row-span-2 group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-50 transition-all duration-300 cursor-pointer">
              <div className={`h-64 bg-gradient-to-br ${events[0].gradient} relative`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs font-bold text-white">{events[0].vibe}</span>
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500 rounded-full text-xs font-bold text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Groups forming
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">{events[0].category} · VI</div>
                <div className="text-lg font-extrabold text-gray-900 mb-2 tracking-tight">{events[0].title}</div>
                <div className="text-sm text-gray-500 mb-4">{events[0].date}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {['bg-orange-400','bg-pink-500','bg-purple-500'].map((c,i) => (
                        <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-white -ml-1.5 first:ml-0`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">+{events[0].going} going</span>
                  </div>
                  <Link href="/events" className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-full hover:bg-orange-600 transition-colors">
                    Get Tickets
                  </Link>
                </div>
              </div>
            </div>

            {events.slice(1, 5).map((event) => (
              <div key={event.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-300 cursor-pointer">
                <div className={`h-36 bg-gradient-to-br ${event.gradient} relative`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                    <span className="px-2.5 py-1 bg-white/90 rounded-full text-xs font-bold text-gray-700">{event.vibe}</span>
                    {event.groups && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-500 rounded-full text-xs font-bold text-white">
                        <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                        Groups
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">{event.category}</div>
                  <div className="text-sm font-extrabold text-gray-900 mb-1 tracking-tight">{event.title}</div>
                  <div className="text-xs text-gray-500 mb-3">{event.date}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">+{event.going} going</span>
                    {event.free ? (
                      <Link href="/events" className="px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 text-xs font-bold rounded-full hover:bg-green-100 transition-colors">Free</Link>
                    ) : (
                      <Link href="/events" className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-full hover:bg-orange-600 transition-colors">Get Tickets</Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/events" className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-gray-200 text-gray-700 font-bold rounded-full hover:border-orange-300 hover:text-orange-500 transition-all">
              View all events <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* VIBES MARQUEE */}
      <div className="bg-orange-500 py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...vibes, ...vibes, ...vibes].map((vibe, i) => (
            <span key={i} className="flex items-center gap-3 mx-6 text-white font-bold text-sm opacity-90">
              {vibe}
              <span className="text-white/40 text-lg">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="bg-white py-20 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3">The Process</div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
              From solo to <span className="text-orange-500">squad</span><br />
              <span className="text-gray-400 font-normal italic">in four easy steps</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-gray-100 rounded-2xl overflow-hidden">
            {[
              { n: '01', icon: '🔍', title: 'Discover Events', desc: 'Browse events near you filtered by vibe, date, and what you are into.' },
              { n: '02', icon: '👥', title: 'Join a Group', desc: 'Find your crew in the event chat or create your own group with your vibe.' },
              { n: '03', icon: '🎟', title: 'Get Tickets', desc: 'Buy solo or split a group ticket through Paddymeet — safe and simple.' },
              { n: '04', icon: '⭐', title: 'Build Your Rep', desc: 'Attend events, earn trust points, unlock perks, and become Legendary.' },
            ].map(({ n, icon, title, desc }) => (
              <div key={n} className="bg-white p-8 hover:bg-orange-50 transition-colors group">
                <div className="text-5xl font-extrabold text-orange-100 mb-4 leading-none italic group-hover:text-orange-200 transition-colors">{n}</div>
                <div className="text-2xl mb-3">{icon}</div>
                <div className="text-base font-extrabold text-gray-900 mb-2 tracking-tight">{title}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="bg-gray-50 py-20 px-6 md:px-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3">Safe and Social</div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
              Real people.<br />
              <span className="text-orange-500 italic">Zero pressure.</span><br />
              <span className="text-gray-400 font-normal italic">Total privacy.</span>
            </h2>
            <div className="mt-8 space-y-4">
              {[
                { icon: Shield, title: 'Everyone is verified', desc: 'Every user completes identity verification at sign up. Age-restricted events are automatically enforced.' },
                { icon: Star, title: 'Your face stays private', desc: 'No real photos on your profile. Your avatar and username are all anyone sees. You decide how much you share.' },
                { icon: Users, title: 'Trust grows with every outing', desc: 'Attend events, join groups, get rated by your crew. Your reputation builds naturally and unlocks better perks.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-sm transition-all">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 mb-1">{title}</div>
                    <div className="text-sm text-gray-500 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-orange-100 rounded-3xl transform rotate-2" />
            <div className="relative bg-white rounded-3xl p-7 shadow-xl border border-gray-100">
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-2.5 shadow-lg border border-gray-100 flex items-center gap-2">
                <span className="text-xl">🎁</span>
                <div>
                  <div className="text-xs font-bold text-gray-900">Reward unlocked!</div>
                  <div className="text-xs text-gray-500">Fresh Crew milestone</div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">K</div>
                <div>
                  <div className="font-bold text-gray-900">@kingsley_v</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Lagos Island</div>
                </div>
                <div className="ml-auto px-3 py-1 bg-orange-50 border border-orange-200 rounded-full text-xs font-bold text-orange-500">Crew</div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span className="font-semibold text-gray-700">Trust Score</span>
                <span className="font-bold text-orange-500">68 / 100</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                <div className="h-full w-[68%] bg-gradient-to-r from-orange-400 to-orange-500 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-2 mb-5">
                {['Afrobeats','House Music','Comedy','Day Parties','Rave'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">{tag}</span>
                ))}
              </div>
              <div className="grid grid-cols-3 border-t border-gray-100 pt-4 text-center">
                {[{ v: '14', l: 'Events' },{ v: '7', l: 'Crews' },{ v: '4.8', l: 'Chemistry' }].map(({ v, l }) => (
                  <div key={l}>
                    <div className="text-xl font-extrabold text-gray-900">{v}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 md:px-10 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-full text-xs font-bold text-orange-500 uppercase tracking-wider mb-8">
            Join Paddymeet — It is Free
          </div>
          <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            Your next night out<br />is waiting for <span className="text-orange-500 italic">you.</span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed mb-10">
            Thousands of people in Lagos are already finding their crew on Paddymeet. Sign up in 2 minutes and find your first event today.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap mb-10">
            {user ? (
              <>
                <Link href="/events" className="flex items-center gap-2 px-10 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all hover:shadow-xl hover:shadow-orange-200 hover:-translate-y-0.5 text-base">
                  Browse Events <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href={dashboardUrl} className="px-10 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-orange-300 hover:text-orange-500 transition-all text-base">
                  Go to Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup" className="flex items-center gap-2 px-10 py-4 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all hover:shadow-xl hover:shadow-orange-200 hover:-translate-y-0.5 text-base">
                  Create Your Free Account <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/events" className="px-10 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-orange-300 hover:text-orange-500 transition-all text-base">
                  Browse Events First
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-gray-400">
            <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Free to sign up</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Identity verified</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Completely anonymous</div>
            <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Events near you</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 py-14 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="text-xl font-bold text-white mb-3">paddy<span className="text-orange-500">meet</span></div>
              <p className="text-sm text-gray-400 leading-relaxed">Find your crew. Experience the night. Built for Lagos, made for everyone.</p>
            </div>
            {[
              { title: 'Platform', links: ['Browse Events','How It Works','Trust and Safety','For Organisers'] },
              { title: 'Company', links: ['About Us','Blog','Careers','Contact'] },
              { title: 'Legal', links: ['Terms of Use','Privacy Policy','Cookie Policy'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{title}</div>
                <ul className="space-y-2.5">
                  {links.map(link => (
                    <li key={link}>
                      <Link href="/signup" className="text-sm text-gray-400 hover:text-white transition-colors">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500">© 2025 Paddymeet. All rights reserved.</div>
            <div className="flex gap-3">
              {['X','in','IG','YT'].map(s => (
                <Link key={s} href="/signup" className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-white hover:border-gray-500 transition-all">
                  {s}
                </Link>
              ))}
            </div>
          </div>
          <SupportChat accountType="explorer" />
        </div>
      </footer>

    </div>
  )
}