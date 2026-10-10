'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Grid3X3, List } from 'lucide-react'

interface TicketType {
  quantity: number
  quantity_sold: number
}

interface EventItem {
  id: string
  title: string
  event_type: string
  city: string
  vibe: string | null
  event_date: string | null
  start_time: string | null
  is_free: boolean
  age_restriction: number
  cover_image_url: string | null
  ticket_types: TicketType[] | null
}

interface Props {
  events: EventItem[]
  gradients: string[]
  hasActiveFilters: boolean
}

export default function EventsResults({ events, gradients, hasActiveFilters }: Props) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-7 h-7 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-700 mb-2">No events found</h3>
        <p className="text-sm text-gray-400 mb-6">
          {hasActiveFilters ? 'Try adjusting your filters or search terms' : 'No events are available right now. Check back soon.'}
        </p>
        {hasActiveFilters && (
          <Link href="/events" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white text-sm font-bold rounded-full hover:bg-orange-600 transition-colors">
            Clear all filters
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Results header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="text-sm font-semibold text-gray-500">
          <span className="text-gray-900 font-bold">{events.length}</span> events found
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-500 font-medium">Sort by</span>
            <select className="text-sm font-semibold text-gray-700 border border-gray-200 rounded-full px-3 py-1.5 bg-white outline-none cursor-pointer">
              <option>Most relevant</option>
              <option>Date — soonest first</option>
              <option>Most popular</option>
              <option>Groups available</option>
            </select>
          </div>
          <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event, index) => {
            const ticketTypesForEvent = event.ticket_types || []
            const allSoldOut = ticketTypesForEvent.length > 0
              && ticketTypesForEvent.every(t => (t.quantity_sold || 0) >= t.quantity)
            return (
              <Link key={event.id} href={`/events/${event.id}`}
                className={`group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-50 transition-all duration-300 ${allSoldOut ? 'opacity-70' : ''}`}>
                <div className={`h-44 relative ${event.cover_image_url ? '' : `bg-gradient-to-br ${gradients[index % gradients.length]}`}`}
                  style={event.cover_image_url ? { backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700">
                      {event.vibe || 'Social'}
                    </span>
                    {allSoldOut ? (
                      <span className="px-2.5 py-1 bg-gray-900/80 backdrop-blur-sm rounded-full text-xs font-bold text-white">Sold Out</span>
                    ) : event.is_free ? (
                      <span className="px-2.5 py-1 bg-green-500 rounded-full text-xs font-bold text-white">Free</span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-500 rounded-full text-xs font-bold text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Groups open
                      </span>
                    )}
                  </div>
                  {event.age_restriction > 0 && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                        {event.age_restriction}+
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">
                    {event.event_type} · {event.city}
                  </div>
                  <div className="text-base font-extrabold text-gray-900 mb-2 tracking-tight leading-snug group-hover:text-orange-500 transition-colors">
                    {event.title}
                  </div>
                  <div className="text-xs text-gray-500 mb-4 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                        : 'TBC'}
                    </span>
                    {event.start_time && <span>{event.start_time.slice(0, 5)}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {['bg-orange-400', 'bg-pink-500', 'bg-purple-500'].map((c, i) => (
                          <div key={i} className={`w-5 h-5 rounded-full ${c} border-2 border-white -ml-1.5 first:ml-0`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">Going</span>
                    </div>
                    {allSoldOut ? (
                      <span className="px-4 py-2 bg-gray-100 text-gray-500 border border-gray-200 text-xs font-bold rounded-full">
                        Sold Out
                      </span>
                    ) : event.is_free ? (
                      <span className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 text-xs font-bold rounded-full">
                        Free
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-full group-hover:bg-orange-600 transition-colors">
                        Get Tickets
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event, index) => {
            const ticketTypesForEvent = event.ticket_types || []
            const allSoldOut = ticketTypesForEvent.length > 0
              && ticketTypesForEvent.every(t => (t.quantity_sold || 0) >= t.quantity)
            return (
              <Link key={event.id} href={`/events/${event.id}`}
                className={`group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-300 p-3 ${allSoldOut ? 'opacity-70' : ''}`}>
                <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-xl relative flex-shrink-0 overflow-hidden ${event.cover_image_url ? '' : `bg-gradient-to-br ${gradients[index % gradients.length]}`}`}
                  style={event.cover_image_url ? { backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                  {allSoldOut && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">Sold Out</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">
                      {event.event_type} · {event.city}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600">
                      {event.vibe || 'Social'}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight leading-snug group-hover:text-orange-500 transition-colors truncate">
                    {event.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                        : 'TBC'}
                    </span>
                    {event.start_time && <span>{event.start_time.slice(0, 5)}</span>}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {allSoldOut ? (
                    <span className="px-4 py-2 bg-gray-100 text-gray-500 border border-gray-200 text-xs font-bold rounded-full whitespace-nowrap">
                      Sold Out
                    </span>
                  ) : event.is_free ? (
                    <span className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 text-xs font-bold rounded-full whitespace-nowrap">
                      Free
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-full group-hover:bg-orange-600 transition-colors whitespace-nowrap">
                      Get Tickets
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
