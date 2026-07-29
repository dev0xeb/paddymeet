'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, X, Copy, Check, Link } from 'lucide-react'

interface Props {
  eventTitle: string
  eventUrl: string
}

export default function ShareButton({ eventTitle, eventUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const message = `Check out ${eventTitle} on Paddymeet! 🎉\n${eventUrl}`
  const encodedMessage = encodeURIComponent(message)
  const encodedUrl = encodeURIComponent(eventUrl)
  const encodedTitle = encodeURIComponent(eventTitle)

  const shareOptions = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodedMessage}`,
      bg: 'bg-green-500',
      hoverBg: 'hover:bg-green-600',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      bg: 'bg-blue-600',
      hoverBg: 'hover:bg-blue-700',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
      bg: 'bg-black',
      hoverBg: 'hover:bg-gray-800',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      name: 'Snapchat',
      href: `https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`,
      bg: 'bg-yellow-400',
      hoverBg: 'hover:bg-yellow-500',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.5 1.1.498 2.946.497 3.55v.003c0 .07.005.141.027.208l.022.065c.148-.03.3-.05.455-.05.517 0 1.003.21 1.373.573.37.366.574.854.574 1.37 0 .98-.633 1.812-1.516 2.114-.018.006-.037.01-.056.015l-.039.01c-.142.038-.32.085-.49.149-.168.062-.336.144-.48.254-.148.112-.265.258-.35.432-.088.178-.132.383-.12.59v.007c.01.166.1.334.207.48.109.149.237.283.358.405l.034.035c.104.104.207.207.295.311.088.104.163.21.22.323.056.112.092.233.1.361.008.13-.01.265-.055.395-.046.128-.12.252-.211.36-.193.222-.468.37-.77.42-.16.027-.325.03-.487.01-.257-.032-.51-.105-.76-.203-.25-.097-.498-.22-.75-.343-.26-.127-.524-.253-.792-.326-.215-.058-.433-.082-.647-.082-.214 0-.432.024-.644.083-.266.072-.526.197-.785.326-.252.123-.5.247-.748.343-.248.097-.501.17-.758.202-.162.02-.327.017-.487-.01-.302-.05-.577-.198-.77-.42-.092-.108-.165-.232-.211-.36-.044-.13-.063-.266-.055-.395.009-.128.044-.249.1-.361.057-.113.132-.219.22-.323.088-.104.19-.207.295-.311l.034-.035c.12-.122.249-.256.358-.405.107-.146.196-.314.207-.48v-.007c.012-.207-.032-.412-.12-.59-.085-.174-.202-.32-.35-.432-.144-.11-.312-.192-.48-.254-.17-.064-.348-.11-.49-.149l-.039-.01c-.019-.005-.038-.009-.056-.015C3.633 13.04 3 12.208 3 11.228c0-.516.204-1.004.574-1.37.37-.363.856-.573 1.373-.573.155 0 .307.02.455.05l.022-.065c.022-.067.027-.137.027-.208v-.003c-.001-.604-.003-2.45.497-3.55C7.459 1.069 10.816.793 11.806.793h.4z"/>
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: null, // Instagram doesn't support direct URL sharing — copy link instead
      bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
      hoverBg: 'hover:opacity-90',
      action: 'instagram',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      ),
    },
  ]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(eventUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInstagram = async () => {
    await navigator.clipboard.writeText(eventUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setTimeout(() => {
      window.open('https://www.instagram.com', '_blank')
    }, 500)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: eventTitle, text: `Check out ${eventTitle} on Paddymeet!`, url: eventUrl })
        return
      } catch { /* user cancelled */ }
    }
    setOpen(!open)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs md:text-sm font-semibold text-white hover:bg-white/30 transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" /> Share
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[999] p-4 w-72">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-extrabold text-gray-900">Share this event</span>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {shareOptions.map(option => (
              <div key={option.name} className="flex flex-col items-center gap-1">
                {option.action === 'instagram' ? (
                  <button
                    onClick={handleInstagram}
                    className={`w-11 h-11 rounded-xl ${option.bg} ${option.hoverBg} flex items-center justify-center transition-all`}
                    title={option.name}
                  >
                    {option.icon}
                  </button>
                ) : (
                  <a
                    href={option.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className={`w-11 h-11 rounded-xl ${option.bg} ${option.hoverBg} flex items-center justify-center transition-all`}
                    title={option.name}
                  >
                    {option.icon}
                  </a>
                )}
                <span className="text-xs text-gray-500 font-medium text-center leading-tight">{option.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 flex-1 truncate">{eventUrl}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
            >
              {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          </div>

          {/* Instagram note */}
          <p className="text-xs text-gray-400 mt-2 text-center">
            Instagram: link copied — paste it in your story or bio
          </p>
        </div>
      )}
    </div>
  )
}