'use client'

import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'

interface Props {
  code?: string
  referralCode?: string
}

export default function ReferralCopyButton({ code, referralCode }: Props) {
  const [copied, setCopied] = useState(false)
  const activeCode = code || referralCode || 'PADDYMEET'

  const getLink = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/signup?ref=${activeCode}`
    }
    return `https://paddymeet.com/signup?ref=${activeCode}`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Join me on PaddyMeet! Use my invite code ${activeCode} to get discounts on tickets & table bookings: ${getLink()}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex-shrink-0"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" /> Copied Link!
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" /> Copy Invite Link
          </>
        )}
      </button>

      <button
        onClick={handleWhatsAppShare}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex-shrink-0"
        title="Share to WhatsApp"
      >
        <Share2 className="w-3.5 h-3.5" /> WhatsApp
      </button>
    </div>
  )
}