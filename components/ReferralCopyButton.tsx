'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function ReferralCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const link = `${window.location.origin}/signup?ref=${code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg ml-2 hover:bg-white/30 transition-colors flex-shrink-0 flex items-center gap-1"
    >
      {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Link</>}
    </button>
  )
}