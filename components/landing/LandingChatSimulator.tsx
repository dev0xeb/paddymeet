'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  ShieldCheck,
  Sparkles,
  EyeOff,
  UserCheck,
  CheckCircle2,
  Lock,
  Send,
  Radio,
  Zap
} from 'lucide-react'

export default function LandingChatSimulator() {
  const [messages, setMessages] = useState<
    { id: number; sender: string; text: string; role: 'user' | 'bot'; time: string; badge?: string }[]
  >([
    {
      id: 1,
      sender: 'Kelechi A.',
      badge: 'Squad Host',
      text: 'Just reserved 4 VIP Balcony seats on Pay & Share! Let’s lock this in.',
      role: 'user',
      time: '10:42 PM',
    },
    {
      id: 2,
      sender: 'Tola M.',
      badge: 'Verified Explorer',
      text: 'Paid my ₦30,000 share right now via Paystack. See you guys there!',
      role: 'user',
      time: '10:43 PM',
    },
    {
      id: 3,
      sender: 'PaddyBot Concierge',
      text: 'Payment confirmed for 4/4 members! Individual encrypted QR Passes are now live in your vaults.',
      role: 'bot',
      time: '10:44 PM',
    },
  ])

  const [inputMsg, setInputMsg] = useState('')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMsg.trim()) return
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'You',
        badge: 'Explorer',
        text: inputMsg.trim(),
        role: 'user',
        time: 'Just now',
      },
    ])
    setInputMsg('')
  }

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#070A0F] relative overflow-hidden">
      
      {/* Ambient Lighting Orbs */}
      <div className="absolute top-1/3 -left-24 w-[450px] h-[450px] bg-[#8B5CF6]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-10 right-0 w-[450px] h-[450px] bg-[#FF5B1E]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* Left: Interactive Smartphone Mockup with Chat Simulator */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-[420px] rounded-[40px] p-4 bg-gradient-to-b from-[#1F293D] via-[#0F141E] to-[#070A0F] border border-white/15 shadow-[0_25px_70px_-20px_rgba(139,92,246,0.3)]">
            
            {/* Phone Bezel Container */}
            <div className="rounded-[32px] bg-[#0A0E17] border border-white/10 overflow-hidden flex flex-col h-[540px]">
              
              {/* Squad Room Top Bar */}
              <div className="p-4 bg-[#121826] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#FF5B1E] flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white uppercase tracking-wider truncate max-w-[170px]">
                      VIP Balcony Crew
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>4 Active Members</span>
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                  <ShieldCheck className="w-3 h-3" /> Score 85+
                </span>
              </div>

              {/* Chat Stream Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-left">
                
                {/* Notice Bubble */}
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center text-[10px] text-slate-400">
                  <Lock className="w-3 h-3 inline mr-1 text-[#8B5CF6]" /> End-to-end encrypted squad table coordination.
                </div>

                {messages.map((m) => {
                  const isBot = m.role === 'bot'
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isBot ? 'items-center' : m.sender === 'You' ? 'items-end' : 'items-start'}`}
                    >
                      {isBot ? (
                        <div className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#10B981]/15 to-[#0F141E] border border-[#10B981]/30 text-[11px] text-emerald-300 space-y-1">
                          <div className="font-bold flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {m.sender}
                          </div>
                          <p className="text-slate-300">{m.text}</p>
                        </div>
                      ) : (
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl border text-xs space-y-1 ${
                            m.sender === 'You'
                              ? 'bg-[#FF5B1E] text-white border-[#FF5B1E]/50 rounded-tr-sm'
                              : 'bg-[#161D2B] text-slate-200 border-white/10 rounded-tl-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 font-semibold">
                            <span>{m.sender}</span>
                            {m.badge && (
                              <span className="px-1.5 py-0.2 rounded bg-white/20 text-[9px] font-mono">
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <p className="leading-relaxed">{m.text}</p>
                          <div className="text-[9px] opacity-60 text-right">{m.time}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSend} className="p-3 bg-[#121826] border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Coordinate with your squad..."
                  className="flex-1 px-3 py-2 bg-[#0A0E17] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#FF5B1E]"
                />
                <button
                  type="submit"
                  aria-label="Send Message"
                  className="w-8 h-8 rounded-xl bg-[#FF5B1E] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#FF4E0D] transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

            </div>

          </div>
        </div>

        {/* Right Column: Problem / Solution Content & Feature Cards */}
        <div className="lg:col-span-6 space-y-6 text-left">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161D2B] border border-white/10 text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-[#8B5CF6]" /> Never Party Alone Engine
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase leading-tight">
            Stop Chasing Friends. Form An Event Squad.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
            Going to events alone is intimidating; coordinating over fragmented WhatsApp groups is chaos. PaddyMeet creates dedicated, verified squad chat rooms for every event table so you can meet fellow explorers and arrive together with peace of mind.
          </p>

          {/* Feature Highlight Cards */}
          <div className="space-y-4 pt-2">
            
            <div className="p-5 rounded-3xl bg-[#0F141E]/90 border border-white/10 flex items-start gap-4 backdrop-blur-xl">
              <div className="w-10 h-10 rounded-2xl bg-[#FF5B1E]/20 text-[#FF5B1E] flex items-center justify-center flex-shrink-0">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">Privacy First Coordination</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Full group chat, ride-sharing coordination, and bottle planning without exposing your personal phone number or private social accounts.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-[#0F141E]/90 border border-white/10 flex items-start gap-4 backdrop-blur-xl">
              <div className="w-10 h-10 rounded-2xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">Verified Trust Score Community</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Only authentic attendees with verified gate attendance and on-time split history can join private squad rooms. Zero spam, zero fake profiles.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </section>
  )
}
