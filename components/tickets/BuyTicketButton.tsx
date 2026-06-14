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
  referral_discount_percent?: number
}

interface Props {
  event: Event
  ticketType: TicketType
  user: User
  label?: string
  fullWidth?: boolean
  autoOpen?: boolean
  onClose?: () => void
}

export default function BuyTicketButton({ event, ticketType, user, label, fullWidth, autoOpen, onClose }: Props) {
  const [open, setOpen] = useState(autoOpen || false)

  const handleClose = () => {
    setOpen(false)
    if (onClose) onClose()
  }

  return (
    <>
      {!autoOpen && (
        <button
          onClick={() => setOpen(true)}
          className={`${fullWidth ? 'w-full py-3.5 rounded-xl' : 'px-5 py-2 rounded-full'} bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors flex items-center justify-center`}
        >
          {label || (event.is_free ? 'Get Free Ticket' : 'Buy Ticket')}
        </button>
      )}

      {open && (
        <TicketPurchaseModal
          event={event}
          ticketType={ticketType}
          user={user}
          onClose={handleClose}
        />
      )}
    </>
  )
}