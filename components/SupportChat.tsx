'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, ChevronRight, ArrowLeft, Send, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface FAQ {
  id: string
  category: string
  question: string
  answer: string
}

interface Message {
  id: string
  message: string
  sender_type: string
  created_at: string
}

interface SupportChatProps {
  accountType?: 'explorer' | 'organiser'
}

type View = 'home' | 'faq' | 'faq-answer' | 'new-ticket' | 'ticket-chat' | 'submitted'

export default function SupportChat({ accountType = 'explorer' }: SupportChatProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('home')
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [ticketId, setTicketId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const categories = [...new Set(faqs.map(f => f.category))]

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase
      .from('faqs')
      .select('*')
      .in('account_type', [accountType, 'all'])
      .eq('is_active', true)
      .order('order_index')
      .then(({ data }) => { if (data) setFaqs(data) })
  }, [open, accountType])

  useEffect(() => {
    // Check for unread support messages
    const checkUnread = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_type', accountType)
      setUnreadCount(count || 0)
    }
    checkUnread()
  }, [accountType])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) return
    setSending(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ticketData: Record<string, string> = {
        subject,
        status: 'open',
        account_type: accountType,
      }
      if (accountType === 'organiser') {
        ticketData.organiser_id = user.id
      } else {
        ticketData.user_id = user.id
      }

      const { data: ticket } = await supabase
        .from('support_tickets')
        .insert(ticketData)
        .select()
        .single()

      if (ticket) {
        await supabase.from('support_messages').insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          sender_type: accountType,
          message,
        })
        setTicketId(ticket.id)
        setView('submitted')
      }
    } catch {
      // handle error
    }
    setSending(false)
  }

  const handleSendReply = async () => {
    if (!reply.trim() || !ticketId) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: newMessage } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_type: accountType,
        message: reply,
      })
      .select()
      .single()

    if (newMessage) {
      setMessages(prev => [...prev, newMessage])
      setReply('')
    }
  }

  const loadTicketMessages = async (tid: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', tid)
      .order('created_at')
    if (data) setMessages(data)
    setTicketId(tid)
    setView('ticket-chat')
  }

  const accentColor = accountType === 'organiser' ? 'bg-blue-500' : 'bg-orange-500'
  const accentHover = accountType === 'organiser' ? 'hover:bg-blue-600' : 'hover:bg-orange-600'
  const accentText = accountType === 'organiser' ? 'text-blue-500' : 'text-orange-500'
  const accentBg = accountType === 'organiser' ? 'bg-blue-50' : 'bg-orange-50'

  return (
    <>
      {/* Chat bubble */}
      <button
        onClick={() => { setOpen(!open); setView('home') }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 ${accentColor} ${accentHover} rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110`}
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold border-2 border-white">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat popup */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: '520px' }}>

          {/* Header */}
          <div className={`${accentColor} p-4`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {view !== 'home' && (
                  <button onClick={() => setView('home')} className="text-white/70 hover:text-white transition-colors mr-1">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <span className="text-white font-extrabold text-sm">Paddymeet Support</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-white/80 text-xs">Online</span>
              </div>
            </div>
            <p className="text-white/70 text-xs">How can we help you today?</p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">

            {/* Home view */}
            {view === 'home' && (
              <div className="p-4 space-y-3">
                <button onClick={() => setView('faq')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-all text-left">
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-0.5">Browse FAQs</div>
                    <div className="text-xs text-gray-500">Find quick answers to common questions</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>

                <button onClick={() => setView('new-ticket')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-all text-left">
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-0.5">Contact Support</div>
                    <div className="text-xs text-gray-500">Send us a message and we&apos;ll reply shortly</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">Typical response time: under 2 hours</p>
                </div>
              </div>
            )}

            {/* FAQ categories */}
            {view === 'faq' && (
              <div className="p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categories</p>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button key={cat}
                      onClick={() => { setSelectedCategory(cat); setView('faq-answer') }}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 transition-all text-left">
                      <span className="text-sm font-semibold text-gray-700">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{faqs.filter(f => f.category === cat).length} articles</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ answers */}
            {view === 'faq-answer' && (
              <div className="p-4">
                {!selectedFaq ? (
                  <>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{selectedCategory}</p>
                    <div className="space-y-2">
                      {faqs.filter(f => f.category === selectedCategory).map(faq => (
                        <button key={faq.id}
                          onClick={() => setSelectedFaq(faq)}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 transition-all text-left">
                          <span className="text-xs font-semibold text-gray-700 leading-relaxed">{faq.question}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div>
                    <button onClick={() => setSelectedFaq(null)} className={`text-xs font-bold ${accentText} mb-3 flex items-center gap-1`}>
                      <ArrowLeft className="w-3 h-3" /> Back
                    </button>
                    <div className="text-sm font-bold text-gray-900 mb-3 leading-relaxed">{selectedFaq.question}</div>
                    <div className={`p-3 ${accentBg} rounded-xl text-xs text-gray-700 leading-relaxed mb-4`}>
                      {selectedFaq.answer}
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-500 mb-2 text-center">Was this helpful?</p>
                      <div className="flex gap-2">
                        <button onClick={() => setView('home')}
                          className="flex-1 py-2 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-xl hover:bg-green-100 transition-colors">
                          Yes, thanks!
                        </button>
                        <button onClick={() => setView('new-ticket')}
                          className="flex-1 py-2 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:border-gray-300 transition-colors">
                          No, contact support
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* New ticket */}
            {view === 'new-ticket' && (
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                  <input
                    type="text"
                    placeholder="What do you need help with?"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your issue in detail..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 transition-all resize-none leading-relaxed"
                  />
                </div>
                <button
                  onClick={handleSubmitTicket}
                  disabled={sending || !subject.trim() || !message.trim()}
                  className={`w-full flex items-center justify-center gap-2 py-3 ${accentColor} ${accentHover} text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            )}

            {/* Submitted */}
            {view === 'submitted' && (
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-green-500" />
                </div>
                <h3 className="text-sm font-extrabold text-gray-900 mb-2">Message sent!</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  We have received your message and will get back to you within 2 hours.
                </p>
                {ticketId && (
                  <button onClick={() => loadTicketMessages(ticketId)}
                    className={`w-full py-2.5 ${accentColor} ${accentHover} text-white text-xs font-bold rounded-xl transition-colors mb-2`}>
                    View Conversation
                  </button>
                )}
                <button onClick={() => setView('home')}
                  className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:border-gray-300 transition-colors">
                  Back to Home
                </button>
              </div>
            )}

            {/* Ticket chat */}
            {view === 'ticket-chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ maxHeight: '280px' }}>
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_type === accountType ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        msg.sender_type === accountType
                          ? `${accentColor} text-white rounded-br-sm`
                          : 'bg-gray-100 text-gray-700 rounded-bl-sm'
                      }`}>
                        {msg.message}
                        <div className={`text-xs mt-1 ${msg.sender_type === accountType ? 'text-white/60' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-gray-100 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-orange-400 transition-all"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!reply.trim()}
                    className={`w-9 h-9 ${accentColor} ${accentHover} rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors flex-shrink-0`}
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}