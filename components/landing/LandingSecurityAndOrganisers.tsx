'use client'

import { useState } from 'react'
import {
  ShieldCheck,
  Lock,
  KeyRound,
  RefreshCw,
  Zap,
  BellRing,
  FileSpreadsheet,
  TrendingUp,
  QrCode,
  ScanLine,
  CheckCircle2,
  Sparkles
} from 'lucide-react'

export default function LandingSecurityAndOrganisers() {
  return (
    <div className="space-y-24 py-24 px-4 sm:px-6 lg:px-8 bg-[#070A0F] text-left">
      
      {/* SECTION 5: GATEKEEPER QR SECURITY */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Text & Security Features */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161D2B] border border-white/10 text-xs font-semibold text-[#10B981] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> Gatekeeper Anti-Fraud Engine
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase leading-tight">
            Zero Screenshot Fraud. Real-Time Gate Verification.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
            Eliminate duplicate tickets, scalping bots, and unauthorized gate access. PaddyMeet uses military-grade dynamic QR encryption paired with dedicated staff passkeys for rapid, sub-second scanning.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            
            <div className="p-5 rounded-2xl bg-[#0F141E] border border-white/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#FF5B1E]/20 text-[#FF5B1E] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold text-white">One-Time Encrypted QR</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Screenshots and shared barcodes are rejected instantly by the door scanner.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0F141E] border border-white/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold text-white">Staff Passkey Engine</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Door bouncers scan tickets without accessing sensitive financial or customer records.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0F141E] border border-white/10 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold text-white">Escrow Refund Safety</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                48-hour automated refund arbitration protecting both partygoers and verified hosts.
              </p>
            </div>

          </div>

        </div>

        {/* Right Column: Animated Gate Scanner Mockup */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[360px] rounded-3xl p-6 bg-gradient-to-b from-[#161D2B] via-[#0F141E] to-[#070A0F] border border-white/15 shadow-2xl relative overflow-hidden">
            
            {/* Animated Laser Beam */}
            <div className="absolute top-1/3 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#10B981] to-transparent shadow-[0_0_15px_#10B981] animate-pulse" />

            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-slate-400">GATE SCANNER v2.4</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> SCAN READY
              </span>
            </div>

            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="w-36 h-36 rounded-2xl bg-white p-3 shadow-2xl flex items-center justify-center relative">
                <QrCode className="w-full h-full text-slate-900" />
                <div className="absolute inset-0 border-2 border-[#10B981] rounded-2xl pointer-events-none animate-ping opacity-20" />
              </div>
              
              <div className="text-center space-y-1">
                <div className="text-xs font-mono font-bold text-white tracking-wider">TICKET #PDM-9941-VIP</div>
                <div className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED ATTENDEE — ENTRY GRANTED
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-center text-[10px] font-mono text-slate-500">
              Latency: 14ms • Location: Gate A (VIP)
            </div>

          </div>
        </div>

      </section>

      {/* SECTION 6: ORGANISER GROWTH STUDIO */}
      <section className="max-w-7xl mx-auto pt-16 border-t border-white/10 space-y-12">
        
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161D2B] border border-white/10 text-xs font-semibold text-[#FF5B1E] uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-[#FF5B1E]" /> Organiser Growth Studio
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase leading-tight">
            Built For Promoters, DJs & Festival Hosts.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed">
            Sell out your events faster, build a loyal community that gets notified the second you drop tickets, and receive instant automated payouts directly to your Nigerian bank account.
          </p>
        </div>

        {/* 4 Organiser Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-3xl bg-[#0F141E]/90 border border-white/10 space-y-4 hover:border-[#FF5B1E]/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5B1E]/20 text-[#FF5B1E] flex items-center justify-center">
              <BellRing className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-white">Follower Drops</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fans follow your organiser profile and get notified the instant your next party drops tickets.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0F141E]/90 border border-white/10 space-y-4 hover:border-[#10B981]/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-white">Automated Bank Payouts</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              1-Click disbursements to GTBank, Access, Zenith, or Kuda with exact 5% platform fee clarity.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0F141E]/90 border border-white/10 space-y-4 hover:border-[#8B5CF6]/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-white">1-Click Guest Manifest</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export verified CSV attendee and table lists for door security, VIP hostesses, and sponsors.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0F141E]/90 border border-white/10 space-y-4 hover:border-[#FBBF24]/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#FBBF24]/20 text-[#FBBF24] flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-white">Live Sales Analytics</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track revenue velocity, conversion rates, and door check-in throughput from your host dashboard.
            </p>
          </div>

        </div>

      </section>

    </div>
  )
}
