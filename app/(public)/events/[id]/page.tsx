import ShareButton from '@/components/ShareButton'
import SupportChat from '@/components/SupportChat'
import OpenGroupButton from '@/components/OpenGroupButton'
import CreateGroupModal from '@/components/CreateGroupModal'
import UserAvatarMenu from '@/components/UserAvatarMenu'
import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, Clock, Users, ArrowLeft } from 'lucide-react'
import BuyTicketButton from '@/components/tickets/BuyTicketButton'
import TicketSelector from '@/components/tickets/TicketSelector'
import TicketGroupBrowser from '@/components/TicketGroupBrowser'
import FollowOrganiserButton from '@/components/FollowOrganiserButton'
import EventChatRoom from '@/components/EventChatRoom'
import Logo from '@/components/Logo'

interface TicketType {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  quantity_sold: number
  is_group_ticket: boolean
  group_size: number
  group_deadline: string | null
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // These don't depend on each other, so run them together instead of
  // one-at-a-time — this is the main content page, so the latency adds up.
  const [
    { data: event },
    { data: profile },
    { data: mainGroup },
    { data: userTickets },
    { data: userProfile },
  ] = await Promise.all([
    supabase
      .from('events')
      .select('*, ticket_types(*), organisers(org_name, contact_name)')
      .eq('id', id)
      .eq('is_approved', true)
      .single(),
    user
      ? supabase.from('users').select('username, tier').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase.from('groups').select('id, name').eq('event_id', id).eq('group_type', 'main').single(),
    user
      ? supabase.from('tickets').select('id').eq('event_id', id).eq('user_id', user.id).eq('status', 'active').limit(1)
      : Promise.resolve({ data: null }),
    user
      ? supabase.from('users').select('referral_discount_percent').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  if (!event) notFound()

  // Get group member count
  const { count: memberCount } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', mainGroup?.id || '')

  const gradients = [
    'from-purple-900 via-pink-900 to-orange-900',
    'from-green-900 via-teal-900 to-blue-900',
    'from-indigo-900 via-purple-900 to-pink-900',
    'from-orange-900 via-red-900 to-pink-900',
    'from-blue-900 via-indigo-900 to-purple-900',
  ]
  const gradient = gradients[id.charCodeAt(0) % gradients.length]

  // Check if user has a ticket or is the organiser
  const isOrganiser = user && event.organiser_id === user.id
  const hasAccess = (userTickets?.length ?? 0) > 0 || !!isOrganiser

  const referralDiscount = userProfile?.referral_discount_percent || 0
  const userData = user ? { id: user.id, email: user.email || '', referral_discount_percent: referralDiscount } : null

  const eventData = {
    id: event.id,
    title: event.title,
    event_date: event.event_date,
    start_time: event.start_time,
    venue_name: event.venue_name,
    is_free: event.is_free,
    cover_image_url: event.cover_image_url,
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-10 bg-white border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          <Logo theme="color" className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          {user && profile ? (
            <UserAvatarMenu username={profile.username} tier={profile.tier || 'Newbie'} />
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">Log In</Link>
              <Link href="/signup" className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className={`h-64 md:h-96 relative mt-16 ${event.cover_image_url ? '' : `bg-gradient-to-br ${gradient}`}`}
  style={event.cover_image_url ? { backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute top-4 left-4 md:top-6 md:left-6">
          <Link href="/events" className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs md:text-sm font-semibold text-white hover:bg-white/30 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to events
          </Link>
        </div>
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <ShareButton
            eventTitle={event.title}
            eventUrl={`https://paddymeet.com/events/${event.id}`}
          />
        </div>
        <div className="absolute bottom-16 left-4 md:bottom-24 md:left-6 flex items-center gap-2 flex-wrap">
          {event.event_type && (
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs font-bold text-white uppercase tracking-wider">
              {event.event_type}
            </span>
          )}
          {event.vibe && (
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs font-bold text-white">
              {event.vibe}
            </span>
          )}
          {event.age_restriction > 0 && (
            <span className="px-2.5 py-1 bg-orange-500/80 rounded-full text-xs font-bold text-white">
              {event.age_restriction}+
            </span>
          )}
        </div>
        <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
          <h1 className="text-2xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Left — main info */}
          <div className="lg:col-span-2 space-y-5">

            {/* Key details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
              <h2 className="text-base font-extrabold text-gray-900 mb-4">Event Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date</div>
                    <div className="text-sm font-bold text-gray-900">
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                        : 'TBC'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Clock className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Time</div>
                    <div className="text-sm font-bold text-gray-900">
                      {event.start_time ? event.start_time.slice(0, 5) : 'TBC'}
                      {event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Venue</div>
                    <div className="text-sm font-bold text-gray-900">{event.venue_name || 'TBC'}</div>
                    {event.venue_address && (
                      <div className="text-xs text-gray-500 mt-0.5">{event.venue_address}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Users className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Organiser</div>
                    <div className="text-sm font-bold text-gray-900">
                      {event.organisers?.org_name || 'Paddymeet'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
                <h2 className="text-base font-extrabold text-gray-900 mb-3">About This Event</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Dress code */}
            {event.dress_code && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
                <h2 className="text-base font-extrabold text-gray-900 mb-3">Dress Code</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{event.dress_code}</p>
              </div>
            )}

            {/* Ticket types */}
            {event.ticket_types && event.ticket_types.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
                <h2 className="text-base font-extrabold text-gray-900 mb-4">Tickets</h2>
                <div className="space-y-3">
                  {event.ticket_types.map((ticket: TicketType) => {
                    const available = ticket.quantity - (ticket.quantity_sold || 0)
                    const soldOut = available <= 0
                    return (
                      <div
                        key={ticket.id}
                        className={`border-2 rounded-2xl p-4 md:p-5 transition-all ${soldOut ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-200 hover:border-orange-300'}`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-sm font-extrabold text-gray-900">{ticket.name}</span>
                              {ticket.is_group_ticket && (
                                <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 text-xs font-bold rounded-full">
                                  Group · {ticket.group_size} people
                                </span>
                              )}
                              {soldOut && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                                  Sold Out
                                </span>
                              )}
                            </div>
                            {ticket.description && (
                              <p className="text-xs text-gray-500 leading-relaxed">{ticket.description}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-extrabold text-gray-900">
                              {event.is_free ? 'Free' : `₦${ticket.price.toLocaleString()}`}
                            </div>
                            {ticket.is_group_ticket && (
                              <div className="text-xs text-gray-400">
                                ≈ ₦{Math.round(ticket.price / ticket.group_size).toLocaleString()} per person
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`text-xs font-semibold ${available < 20 && !soldOut ? 'text-orange-500' : 'text-gray-400'}`}>
                            {soldOut ? 'No tickets left' : available < 20 ? `Only ${available} left` : `${available} available`}
                          </span>
                          {!soldOut && (
                            userData ? (
                              <BuyTicketButton
                                event={eventData}
                                ticketType={ticket}
                                user={userData}
                              />
                            ) : (
                              <Link href="/signup" className="px-5 py-2 bg-orange-500 text-white text-xs font-bold rounded-full hover:bg-orange-600 transition-colors">
                                Sign up to buy
                              </Link>
                            )
                          )}
                        </div>

                        {ticket.is_group_ticket && (
                          <div className="mt-4">
                            <TicketGroupBrowser
                              eventId={event.id}
                              eventTitle={event.title}
                              ticketType={ticket}
                              userId={userData?.id || ''}
                              userEmail={userData?.email || ''}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Live 2-Tier Event Chat & Open Squads */}
            <div id="chat-lounge" className="mb-6">
              <EventChatRoom
                eventId={event.id}
                eventTitle={event.title}
                mainGroupId={mainGroup?.id || `main-${event.id}`}
                hasTicket={hasAccess}
                currentUserId={user?.id}
                currentUsername={profile?.username || 'Explorer'}
              />
            </div>

            {/* House rules */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
              <h2 className="text-base font-extrabold text-gray-900 mb-3">House Rules</h2>
              <div className="space-y-2">
                {[
                  'Valid ID required at entry. Age restriction strictly enforced.',
                  'No re-entry after exit. Keep your ticket or wristband on at all times.',
                  'The organiser reserves the right to refuse entry.',
                  'Paddymeet is not liable for lost or stolen items at the venue.',
                ].map((rule, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                    {rule}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right — sticky sidebar */}
          <div className="space-y-4">
            {/* Hosted by Organiser Card */}
            {event.organisers && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
                    {(Array.isArray(event.organisers) ? event.organisers[0]?.org_name : event.organisers?.org_name)?.charAt(0)?.toUpperCase() || 'O'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Hosted by</div>
                    <div className="text-sm font-extrabold text-gray-900 truncate">
                      {Array.isArray(event.organisers) ? event.organisers[0]?.org_name : event.organisers?.org_name}
                    </div>
                  </div>
                </div>
                {event.organiser_id && (
                  <FollowOrganiserButton
                    organiserId={event.organiser_id}
                    organiserName={Array.isArray(event.organisers) ? event.organisers[0]?.org_name : event.organisers?.org_name}
                  />
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:sticky lg:top-24">
              <div className="text-center pb-4 border-b border-gray-100 mb-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {event.is_free ? 'Free Event' : 'Tickets Available'}
                </div>
                {event.is_free ? (
                  <div className="text-2xl font-extrabold text-green-500">Free</div>
                ) : (
                  <div className="text-xs text-gray-500">See ticket options below</div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {event.cancellation_policy && (
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{event.cancellation_policy}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>Valid ID required at entry</span>
                </div>
                {event.age_restriction > 0 && (
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{event.age_restriction}+ only. Age strictly enforced.</span>
                  </div>
                )}
              </div>

              {userData && event.ticket_types && event.ticket_types.length > 0 ? (
                <TicketSelector
                  event={eventData}
                  ticketTypes={event.ticket_types}
                  user={userData}
                  label={event.is_free ? 'Get Free Ticket' : 'Get Tickets'}
                  fullWidth
                />
              ) : !userData ? (
                <div className="space-y-2">
                  <Link href="/signup" className="w-full flex items-center justify-center py-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
                    Sign up to get tickets
                  </Link>
                  <Link href="/login" className="w-full flex items-center justify-center py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:border-gray-300 transition-colors">
                    Already have an account? Log in
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

        </div>
        <SupportChat accountType="explorer" />
      </div>
    </div>
  )
}