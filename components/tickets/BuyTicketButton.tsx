'use client'

import { useState } from 'react'
import TicketPurchaseModal from './TicketPurchaseModal'

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
}

interface Props {
  event: Event
  ticketType: TicketType
  user: User
  label?: string
}

export default function BuyTicketButton({ event, ticketType, user, label }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2 bg-orange-500 text-white text-xs font-bold rounded-full hover:bg-orange-600 transition-colors"
      >
        {label || (event.is_free ? 'Get Free Ticket' : 'Buy Ticket')}
      </button>

      {open && (
        <TicketPurchaseModal
          event={event}
          ticketType={ticketType}
          user={user}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}