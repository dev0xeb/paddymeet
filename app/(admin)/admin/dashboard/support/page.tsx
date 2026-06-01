'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Send, Clock, CheckCircle, User, Building2, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Ticket {
  id: string
  subject: string
  status: string
  account_type: string
  created_at: string
  user_id: string | null
  organiser_id: string | null
  last_message?: string
  unread_count?: number
}

interface Message {
  id: string
  message: string
  sender_type: string
  created_at: string
}

type FilterType = 'all' | 'open' | 'resolved' | 'explorer' | 'organiser'

async function getTickets(): Promise<Ticket[]> {
  try {
    const res = await fetch('/api/admin/support/tickets')
    const data = await res.json()
    return data.tickets || []
  } catch {
    return []
  }
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<FilterType>('open')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getTickets().then(data => {
      setTickets(data)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const loadMessages = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    const supabase = createClient()
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at')
    if (data) setMessages(data)

    // Mark as read
    await supabase
      .from('support_messages')
      .update({ is_read: true })
      .eq('ticket_id', ticket.id)
      .eq('sender_type', ticket.account_type)
  }

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return
    setSending(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: newMessage } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        sender_type: 'support',
        message: reply,
      })
      .select()
      .single()

    if (newMessage) {
      setMessages(prev => [...prev, newMessage])
      setReply('')

      // Notify the user
      const notifyId = selectedTicket.user_id || selectedTicket.organiser_id
      if (notifyId) {
        await supabase.from('notifications').insert({
          user_id: notifyId,
          title: 'Support reply',
          message: `Paddymeet support replied to your ticket: ${selectedTicket.subject}`,
          type: 'support',
          is_read: false,
        })
      }
    }
    setSending(false)
  }

  const handleResolve = async (ticketId: string) => {
    const supabase = createClient()
    await supabase
      .from('support_tickets')
      .update({ status: 'resolved' })
      .eq('id', ticketId)

    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t))
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: 'resolved' } : null)
    }
  }

  const filteredTickets = tickets.filter(t => {
    if (filter === 'open') return t.status === 'open'
    if (filter === 'resolved') return t.status === 'resolved'
    if (filter === 'explorer') return t.account_type === 'explorer'
    if (filter === 'organiser') return t.account_type === 'organiser'
    return true
  })

  const openCount = tickets.filter(t => t.status === 'open').length

  return (
    <div className="min-h-screen bg-gray-50">

      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Support Tickets
          </span>
          {openCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {openCount} open
            </span>
          )}
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 flex h-screen">

        {/* Left — ticket list */}
        <div className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">

          {/* Filters */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              {(['all', 'open', 'resolved', 'explorer', 'organiser'] as FilterType[]).map(f => (
                <button key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all capitalize ${
                    filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket list */}
          <div className="flex-1 overflow-y-auto">
            {!loaded ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map(ticket => (
                <button key={ticket.id}
                  onClick={() => loadMessages(ticket)}
                  className={`w-full p-4 border-b border-gray-50 text-left hover:bg-gray-50 transition-colors ${
                    selectedTicket?.id === ticket.id ? 'bg-orange-50 border-l-2 border-l-orange-400' : ''
                  }`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {ticket.account_type === 'organiser'
                        ? <Building2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        : <User className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      }
                      <span className="text-xs font-bold text-gray-900 truncate max-w-[160px]">{ticket.subject}</span>
                    </div>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      ticket.status === 'open'
                        ? 'bg-orange-50 text-orange-500'
                        : 'bg-green-50 text-green-600'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                      ticket.account_type === 'organiser' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'
                    }`}>
                      {ticket.account_type}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No tickets found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right — chat view */}
        <div className="flex-1 flex flex-col">
          {selectedTicket ? (
            <>
              {/* Ticket header */}
              <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedTicket.account_type === 'organiser'
                      ? <Building2 className="w-4 h-4 text-blue-500" />
                      : <User className="w-4 h-4 text-orange-500" />
                    }
                    <span className="text-sm font-extrabold text-gray-900">{selectedTicket.subject}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                      selectedTicket.status === 'open'
                        ? 'bg-orange-50 text-orange-500 border-orange-200'
                        : 'bg-green-50 text-green-600 border-green-200'
                    }`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {selectedTicket.account_type === 'organiser' ? 'Organiser' : 'Explorer'} · Opened {new Date(selectedTicket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                {selectedTicket.status === 'open' && (
                  <button
                    onClick={() => handleResolve(selectedTicket.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-xl hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'support' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender_type === 'support'
                        ? 'bg-gray-900 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${msg.sender_type === 'support' ? 'text-orange-400' : 'text-gray-500'}`}>
                          {msg.sender_type === 'support' ? 'Support Team' : msg.sender_type === 'organiser' ? 'Organiser' : 'User'}
                        </span>
                        <span className={`text-xs ${msg.sender_type === 'support' ? 'text-gray-400' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              {selectedTicket.status === 'open' && (
                <div className="bg-white border-t border-gray-100 p-4 flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReply()}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 transition-all"
                  />
                  <button
                    onClick={handleReply}
                    disabled={!reply.trim() || sending}
                    className="px-5 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    Reply
                  </button>
                </div>
              )}

              {selectedTicket.status === 'resolved' && (
                <div className="bg-green-50 border-t border-green-100 p-4 text-center text-sm text-green-600 font-semibold">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  This ticket has been resolved
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-400 mb-1">Select a ticket</p>
                <p className="text-xs text-gray-400">Choose a support ticket from the left to view and reply</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}