import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, XCircle, Calendar, Clock, MapPin,
  Mail, Phone, User, Ticket, ShieldCheck, ShieldAlert,
  Globe, Share2, Eye, KeyRound
} from 'lucide-react'
import AdminApproveEventButton from '@/components/AdminApproveEventButton'
import Logo from '@/components/Logo'

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const adminClient = createAdminClient()
  const { data: admin } = await adminClient
    .from('admin_team')
    .select('department')
    .eq('id', user.id)
    .single()
  if (!admin) redirect('/admin-login')

  const { data: event } = await adminClient
    .from('events')
    .select('*, organisers(id, org_name, contact_name, email, phone, is_verified), ticket_types(*)')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const organiser = event.organisers as unknown as {
    id: string, org_name: string, contact_name: string, email: string, phone: string, is_verified: boolean
  } | null

  const badge = event.is_rejected
    ? { label: 'Rejected', class: 'bg-red-50 text-red-500 border-red-200' }
    : event.is_approved && event.is_live
    ? { label: 'Live', class: 'bg-green-50 text-green-600 border-green-200' }
    : event.is_approved
    ? { label: 'Approved', class: 'bg-blue-50 text-blue-600 border-blue-200' }
    : { label: 'Pending Review', class: 'bg-orange-50 text-orange-500 border-orange-200' }

  const needsDecision = !event.is_approved && !event.is_rejected

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 sm:px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/events" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Events
          </Link>
          <div className="hidden sm:block h-5 w-px bg-gray-700" />
          <span className="hidden sm:inline-flex text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Event Moderation
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          <Logo theme="white" className="h-6 w-auto" />
        </Link>
      </nav>

      <div className="pt-16 max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero */}
        <div
          className={`h-48 sm:h-56 rounded-2xl relative mb-6 overflow-hidden ${event.cover_image_url ? '' : 'bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900'}`}
          style={event.cover_image_url ? { backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.class}`}>
              {badge.label}
            </span>
            {event.is_free && (
              <span className="px-2.5 py-1 bg-green-50 text-green-600 border border-green-200 rounded-full text-xs font-bold">Free</span>
            )}
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{event.title}</h1>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-white/80 flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'TBC'}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{event.start_time ? event.start_time.slice(0, 5) : 'TBC'}{event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ''}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.venue_name}{event.city ? `, ${event.city}` : ''}</span>
            </div>
          </div>
        </div>

        {/* Moderation action bar */}
        {needsDecision && (
          <div className="flex items-center justify-between gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6 flex-wrap">
            <div>
              <div className="text-sm font-bold text-orange-700">This event is awaiting a decision</div>
              <div className="text-xs text-orange-600">Review the details below, then approve or reject.</div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/events/${event.id}`} target="_blank"
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-orange-200 text-orange-700 text-xs font-bold rounded-xl hover:bg-orange-50 transition-colors">
                <Eye className="w-3.5 h-3.5" /> Preview
              </Link>
              <AdminApproveEventButton
                eventId={event.id}
                eventTitle={event.title}
                organiserId={organiser?.id}
                organiserName={organiser?.org_name}
                isHostVerified={organiser?.is_verified}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
              />
              <form action={`/api/admin/events/${event.id}/reject`} method="POST">
                <button type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Live event — allow takedown */}
        {event.is_approved && event.is_live && (
          <div className="flex items-center justify-between gap-3 p-4 bg-white border border-gray-100 rounded-xl mb-6 flex-wrap">
            <div className="text-sm text-gray-500">This event is live and visible to explorers.</div>
            <div className="flex items-center gap-2">
              <Link href={`/events/${event.id}`} target="_blank"
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:border-gray-300 transition-colors">
                <Eye className="w-3.5 h-3.5" /> View Live
              </Link>
              <form action={`/api/admin/events/${event.id}/reject`} method="POST">
                <button type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
                  <XCircle className="w-3.5 h-3.5" /> Take Down
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left — event details */}
          <div className="lg:col-span-2 space-y-5">

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-extrabold text-gray-900 mb-4">Event Details</h2>
              <div className="space-y-3">
                {[
                  { label: 'Event type', value: event.event_type || '—' },
                  { label: 'Vibe', value: event.vibe || '—' },
                  { label: 'Venue', value: event.venue_name || 'TBC' },
                  { label: 'Address', value: event.venue_address || '—' },
                  { label: 'City', value: `${event.city || '—'}${event.state ? `, ${event.state}` : ''}` },
                  { label: 'Age restriction', value: event.age_restriction > 0 ? `${event.age_restriction}+` : 'All ages' },
                  { label: 'Capacity', value: event.capacity ? event.capacity.toLocaleString() : '—' },
                  { label: 'Dress code', value: event.dress_code || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-bold text-gray-400 w-28 flex-shrink-0 uppercase tracking-wider pt-0.5">{label}</span>
                    <span className="text-sm text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {event.description && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-sm font-extrabold text-gray-900 mb-3">Description</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{event.description}</p>
              </div>
            )}

            {/* Ticket types */}
            {event.ticket_types && event.ticket_types.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-sm font-extrabold text-gray-900 mb-4">Ticket Types</h2>
                <div className="space-y-3">
                  {event.ticket_types.map((t: { id: string, name: string, price: number, quantity: number, quantity_sold: number, description: string, is_group_ticket: boolean, group_size: number }) => (
                    <div key={t.id} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900">{t.name}</div>
                          {t.description && <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>}
                        </div>
                        <div className="text-sm font-bold text-gray-900 flex-shrink-0">{t.price > 0 ? `₦${t.price.toLocaleString()}` : 'Free'}</div>
                        <div className="text-xs text-gray-500 flex-shrink-0">
                          {t.quantity_sold || 0}/{t.quantity} sold
                        </div>
                      </div>
                      {t.is_group_ticket && (
                        <div className="mt-2 text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-100 inline-flex px-2 py-0.5 rounded-full">
                          Group ticket — {t.group_size} per group
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.cancellation_policy && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-sm font-extrabold text-gray-900 mb-3">Cancellation Policy</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{event.cancellation_policy}</p>
              </div>
            )}

            {event.house_rules && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-sm font-extrabold text-gray-900 mb-3">House Rules</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{event.house_rules}</p>
              </div>
            )}

            {event.is_rejected && event.rejection_reason && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                <h2 className="text-sm font-extrabold text-red-700 mb-2">Rejection Reason</h2>
                <p className="text-sm text-red-600 leading-relaxed">{event.rejection_reason}</p>
              </div>
            )}

          </div>

          {/* Right — organiser & links */}
          <div className="space-y-5">

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Organiser</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                  organiser?.is_verified
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : 'bg-orange-50 text-orange-500 border-orange-200'
                }`}>
                  {organiser?.is_verified ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                  {organiser?.is_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <div className="space-y-2.5 mb-4">
                <Link href={`/admin/dashboard/organisers/${organiser?.id}`} className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors block">
                  {organiser?.org_name || 'Organiser'}
                </Link>
                {organiser?.contact_name && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <User className="w-3.5 h-3.5 text-gray-400" /> {organiser.contact_name}
                  </div>
                )}
                {organiser?.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> {organiser.email}
                  </div>
                )}
                {organiser?.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {organiser.phone}
                  </div>
                )}
              </div>
              <Link href={`/admin/dashboard/organisers/${organiser?.id}`}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:border-gray-300 transition-colors">
                View Organiser Profile
              </Link>
            </div>

            {(event.website || event.social_link) && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Links</h2>
                <div className="space-y-2">
                  {event.website && (
                    <a href={event.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-500 hover:underline truncate">
                      <Globe className="w-3.5 h-3.5 flex-shrink-0" /> {event.website}
                    </a>
                  )}
                  {event.social_link && (
                    <a href={event.social_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-500 hover:underline truncate">
                      <Share2 className="w-3.5 h-3.5 flex-shrink-0" /> {event.social_link}
                    </a>
                  )}
                </div>
              </div>
            )}

            {event.scanner_passkey && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Gate Scanner Passkey
                </h2>
                <div className="text-xl font-extrabold text-gray-900 tracking-[0.15em]">{event.scanner_passkey}</div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5" /> Submitted
              </h2>
              <div className="text-sm text-gray-700">
                {event.created_at ? new Date(event.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
