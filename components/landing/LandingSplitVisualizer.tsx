'use client'

import { useState } from 'react'
import {
  Layers,
  Share2,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react'

const STEPS = [
  {
    step: 1,
    icon: Layers,
    title: 'Host Locks Group Table',
    desc: 'Host reserves a VIP table (e.g. ₦150,000 for 5 members). The inventory is locked for 10 minutes.',
    badge: '10-Min Escrow Lock',
    badgeColor: 'text-[#FF5B1E] bg-[#FF5B1E]/20 border-[#FF5B1E]/30',
  },
  {
    step: 2,
    icon: Share2,
    title: 'Generate 1-Click Share Links',
    desc: 'PaddyMeet generates a unique Pay & Share link to forward directly to friends via WhatsApp or Twitter.',
    badge: 'WhatsApp Ready',
    badgeColor: 'text-[#8B5CF6] bg-[#8B5CF6]/20 border-[#8B5CF6]/30',
  },
  {
    step: 3,
    icon: CreditCard,
    title: 'Individual Paystack Checkout',
    desc: 'Each friend pays their exact ₦30,000 share. Nobody has to front ₦150,000 or chase people for transfers.',
    badge: '₦30k / Person',
    badgeColor: 'text-[#FBBF24] bg-[#FBBF24]/20 border-[#FBBF24]/30',
  },
  {
    step: 4,
    icon: QrCode,
    title: 'Instant Encrypted QR Passes',
    desc: 'As each share clears, encrypted digital QR passes are automatically generated into everyone’s Pass Vault.',
    badge: '100% Gate Ready',
    badgeColor: 'text-[#10B981] bg-[#10B981]/20 border-[#10B981]/30',
  },
]

export default function LandingSplitVisualizer() {
  const [activeStep, setActiveStep] = useState(1)

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0F141E]/90 border-t border-b border-white/5 relative overflow-hidden text-left">
      
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-[500px] h-[500px] bg-[#FF5B1E]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161D2B] border border-white/10 text-xs font-semibold text-[#FF5B1E] uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-[#FF5B1E]" /> Pay & Share Split Technology
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase leading-tight">
            Never Front ₦200k For A Table Again.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
            Eliminate awkward bank transfer reminders and split bills instantly. PaddyMeet locks the table inventory and collects individual shares directly from each attendee before generating gate passes.
          </p>
        </div>

        {/* Interactive 4-Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => {
            const Icon = s.icon
            const isSelected = activeStep === s.step

            return (
              <div
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#1F293D] to-[#121826] border-[#FF5B1E]/60 shadow-[0_20px_50px_-15px_rgba(255,91,30,0.25)] scale-[1.02]'
                    : 'bg-[#121826]/70 border-white/10 hover:border-white/20 hover:bg-[#161D2B]'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-base shadow-md ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#FF5B1E] to-[#8B5CF6]'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Step 0{s.step}
                    </div>
                    <h3 className="text-base font-extrabold text-white leading-snug">
                      {s.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-semibold">
                  <span className={isSelected ? 'text-[#FF5B1E]' : 'text-slate-500'}>
                    {isSelected ? 'Active Step' : 'Click to preview'}
                  </span>
                  <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-[#FF5B1E]' : 'text-slate-600'}`} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Live Simulation Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#121826]/90 border border-white/10 backdrop-blur-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#FF5B1E] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Live Split Simulation: VIP Cabana Table
            </div>
            <h4 className="text-xl font-extrabold text-white">
              ₦150,000 Table Split for 5 Friends = ₦30,000 / Person
            </h4>
            <p className="text-xs text-slate-400">
              4 of 5 shares settled via Paystack. 1 share remaining before 10-minute hold lock clears.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-shrink-0">
            <div className="h-3 w-40 sm:w-56 bg-white/10 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-gradient-to-r from-[#FF5B1E] to-[#10B981] rounded-full w-[80%]" />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">80% Paid</span>
          </div>
        </div>

      </div>

    </section>
  )
}
