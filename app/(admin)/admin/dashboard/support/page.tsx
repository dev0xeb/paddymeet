'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MessageSquare, Send, Clock, CheckCircle2,
  User, Building2, Filter, Search, AlertCircle, Shield,
  Phone, Mail, Check, Loader2, Sparkles, RefreshCw, Plus, X
} from 'lucide-react'

interface SupportUser {
  id: string
  username: string
  email: string
  phone?: string
  avatar_url?: string
  trust_score?: number
}

interface SupportTicket {
  id: string
  user_id: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  users?: SupportUser
}

interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: string
  sender_type: 'user' | 'admin' | 'support'
  message: string
  is_read: boolean
  created_at: string
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [replyText, setReplyText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const [newTicketModal, setNewTicketModal] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [creatingTicket, setCreatingTicket] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/admin/support/tickets?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.tickets) {
        setTickets(data.tickets)
        if (selectedTicket) {
          const updated = data.tickets.find((t: SupportTicket) => t.id === selectedTicket.id)
          if (updated) setSelectedTicket(updated)
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingTickets(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, searchQuery])

  const loadTicketMessages = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticket.id}/messages`)
      const data = await res.json()
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch {
      // ignore
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket || sendingReply) return
    setSendingReply(true)
    const textToSend = replyText.trim()

    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      })
      const data = await res.json()
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message])
        setReplyText('')
        fetchTickets()
      }
    } catch {
      // ignore
    } finally {
      setSendingReply(false)
    }
  }

  const handleUpdateStatus = async (ticketId: string, nextStatus: SupportTicket['status']) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: nextStatus } : t))
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(prev => prev ? { ...prev, status: nextStatus } : null)
        }
      }
    } catch {
      // ignore
    }
  }

  const handleUpdatePriority = async (ticketId: string, nextPriority: SupportTicket['priority']) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: nextPriority }),
      })
      const data = await res.json()
      if (data.success) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, priority: nextPriority } : t))
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(prev => prev ? { ...prev, priority: nextPriority } : null)
        }
      }
    } catch {
      // ignore
    }
  }

  const handleCreateNewTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim() || !newMessage.trim() || creatingTicket) return
    setCreatingTicket(true)

    try {
      const res = await fetch('/api/admin/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject.trim(),
          message: newMessage.trim(),
          priority: newPriority,
        }),
      })
      const data = await res.json()
      if (data.success && data.ticket) {
        setNewSubject('')
        setNewMessage('')
        setNewTicketModal(false)
        fetchTickets()
        loadTicketMessages(data.ticket)
      }
    } catch {
      // ignore
    } finally {
      setCreatingTicket(false)
    }
  }

  const cannedResponses = [
    "Hello! Thanks for reaching out. We have verified your ticket pass and it is ready for check-in.",
    "Your event payout has been approved and is being dispatched to your bank account.",
    "We have reviewed your request and updated your account status. Let us know if you need anything else!",
    "Could you please confirm the payment reference or registered email associated with this order?"
  ]

  const priorityBadges = {
    urgent: 'bg-rose-50 text-rose-700 border-rose-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  const statusBadges = {
    open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-slate-100 text-slate-700 border-slate-200',
    closed: 'bg-slate-50 text-slate-500 border-slate-200',
  }

  return (
    <div className="min-h-screen bg-slate-50 antialiased flex flex-col">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-slate-700" />
          <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Support Desk & Help Centre
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setNewTicketModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
          <Link href="/" className="text-lg font-bold text-white tracking-tight pl-2">
            paddy<span className="text-orange-500">meet</span>
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="pt-16 flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-6">
        
        {/* Support Workspace Split Pane */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-120px)]">
          
          {/* Left Column: Tickets Queue (4 Cols) */}
          <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            
            {/* Search & Filter Header */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tickets or subjects..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all"
                />
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'open', label: 'Open' },
                  { id: 'in_progress', label: 'In Progress' },
                  { id: 'resolved', label: 'Resolved' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      statusFilter === tab.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingTickets ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                  Loading tickets...
                </div>
              ) : tickets.length > 0 ? (
                tickets.map(ticket => {
                  const isSelected = selectedTicket?.id === ticket.id
                  const displayName = ticket.users?.username || ticket.users?.email || 'Attendee'

                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => loadTicketMessages(ticket)}
                      className={`w-full p-4 text-left transition-colors flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-orange-50/60 border-l-4 border-orange-500'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-xs text-slate-900 truncate">{displayName}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${priorityBadges[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {ticket.subject}
                      </div>

                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {ticket.message}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span className={`px-2 py-0.5 rounded-md font-semibold border ${statusBadges[ticket.status]}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span>
                          {new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="p-12 text-center">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No support tickets found</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click <strong>&ldquo;+ New Ticket&rdquo;</strong> above to create a test inbound support request.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Chat & Ticket Details (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {selectedTicket ? (
              <>
                {/* Active Ticket Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-sm font-bold text-slate-900">{selectedTicket.subject}</h2>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${priorityBadges[selectedTicket.priority]}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>User: <strong>{selectedTicket.users?.username || 'Attendee'}</strong></span>
                      {selectedTicket.users?.email && <span>· {selectedTicket.users.email}</span>}
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedTicket.status}
                      onChange={e => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-orange-500 shadow-sm"
                    >
                      <option value="open">🟢 Open</option>
                      <option value="in_progress">🟡 In Progress</option>
                      <option value="resolved">⚪ Resolved</option>
                      <option value="closed">⚫ Closed</option>
                    </select>

                    {selectedTicket.status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                      </button>
                    )}
                  </div>
                </div>

                {/* Conversation History Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
                  {/* Initial Ticket Message */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                      {selectedTicket.users?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="max-w-[85%] bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                      <div className="flex items-center justify-between gap-4 mb-1 text-[11px]">
                        <span className="font-bold text-slate-900">{selectedTicket.users?.username || 'Attendee'}</span>
                        <span className="text-slate-400">
                          {new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedTicket.message}
                      </p>
                    </div>
                  </div>

                  {/* Thread messages */}
                  {messages.map(msg => {
                    const isAdmin = msg.sender_type === 'admin' || msg.sender_type === 'support'

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm ${
                          isAdmin ? 'bg-orange-500 text-white' : 'bg-slate-900 text-white'
                        }`}>
                          {isAdmin ? 'P' : selectedTicket.users?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                          isAdmin
                            ? 'bg-slate-900 text-white rounded-tr-sm'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                        }`}>
                          <div className="flex items-center justify-between gap-4 mb-1 text-[11px]">
                            <span className={`font-bold ${isAdmin ? 'text-orange-400' : 'text-slate-900'}`}>
                              {isAdmin ? 'PaddyMeet Support Agent' : selectedTicket.users?.username || 'Attendee'}
                            </span>
                            <span className={isAdmin ? 'text-slate-400' : 'text-slate-400'}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    )
                  })}

                  <div ref={messagesEndRef} />
                </div>

                {/* Canned Responses Chips */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-orange-500" /> Quick Replies:
                  </span>
                  {cannedResponses.map((text, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReplyText(text)}
                      className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 hover:border-orange-400 hover:text-orange-600 rounded-lg whitespace-nowrap text-slate-600 transition-colors shadow-xs"
                    >
                      {text.slice(0, 32)}...
                    </button>
                  ))}
                </div>

                {/* Reply Composer */}
                <div className="p-4 border-t border-slate-200 bg-white">
                  <div className="flex items-end gap-3">
                    <textarea
                      rows={3}
                      placeholder={`Reply to ${selectedTicket.users?.username || 'user'}...`}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendReply()
                        }
                      }}
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 focus:bg-white resize-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sendingReply}
                      className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0 h-[60px]"
                    >
                      {sendingReply ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Send Reply</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
                    <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
                    <span>Direct in-app notification will be pushed to recipient</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4 border border-orange-200/60 shadow-sm">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Select a Support Ticket</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Choose an open customer request from the left queue to review conversation history and send replies.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal: Create Inbound / Test Support Ticket */}
      {newTicketModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setNewTicketModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Support Ticket</h3>
                <p className="text-xs text-slate-500">Log an inbound inquiry or create a support case</p>
              </div>
            </div>

            <form onSubmit={handleCreateNewTicket} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Subject Line <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Issue with VIP ticket refund for All Nigh Rave"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Priority Level
                </label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500 font-medium"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Message Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Details of the support inquiry..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {creatingTicket ? 'Creating Ticket...' : 'Create Ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => setNewTicketModal(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}