'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import BuyTicketButton from './BuyTicketButton'

interface TicketType {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  quantity_sold: number
  is_group_ticket: boolean
  group_size: number
}

interface Event {
  id: string
  title: string
  event_date: string
  start_time: string
  venue_name: string
  is_free: boolean
}

interface User {
  id: string
  email: string
  referral_discount_percent?: number
}

interface Props {
  event: Event
  ticketTypes: TicketType[]
  user: User
  label?: string
  fullWidth?: boolean
}

export default function TicketSelector({ event, ticketTypes, user, label, fullWidth }: Props) {
  const [showSelector, setShowSelector] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null)

  // If only one ticket type open purchase directly
  if (ticketTypes.length === 1) {
    return (
      <BuyTicketButton
        event={event}
        ticketType={ticketTypes[0]}
        user={user}
        label={label}
        fullWidth={fullWidth}
      />
    )
  }

  return (
    <>
      <button
        onClick={() => setShowSelector(true)}
        className={`${fullWidth ? 'w-full py-3.5 rounded-xl' : 'px-5 py-2 rounded-full'} bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors flex items-center justify-center`}
      >
        {label || (event.is_free ? 'Get Free Ticket' : 'Get Tickets')}
      </button>

      {/* Ticket type selector */}
      {showSelector && !selectedTicket && (
        <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSelector(false)}
          />
          <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900">Choose a Ticket</h2>
              <button
                onClick={() => setShowSelector(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {ticketTypes.map(ticket => {
                const available = ticket.quantity - (ticket.quantity_sold || 0)
                const soldOut = available <= 0
                return (
                  <button
                    key={ticket.id}
                    disabled={soldOut}
                    onClick={() => {
                      setSelectedTicket(ticket)
                      setShowSelector(false)
                    }}
                    className={`w-full text-left border-2 rounded-2xl p-4 transition-all ${
                      soldOut
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
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
                        <p className={`text-xs font-semibold mt-1 ${available < 20 && !soldOut ? 'text-orange-500' : 'text-gray-400'}`}>
                          {soldOut ? 'No tickets left' : available < 20 ? `Only ${available} left` : `${available} available`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-base font-extrabold text-gray-900">
                          {event.is_free ? 'Free' : `₦${ticket.price.toLocaleString()}`}
                        </div>
                        {ticket.is_group_ticket && (
                          <div className="text-xs text-gray-400">
                            ≈ ₦{Math.round(ticket.price / ticket.group_size).toLocaleString()} each
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Once ticket selected open purchase modal */}
      {selectedTicket && (
        <BuyTicketButton
          event={event}
          ticketType={selectedTicket}
          user={user}
          autoOpen
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </>
  )
}