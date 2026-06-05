'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Ticket, Users, Star,
  Gift, Settings, LogOut, ChevronDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Props {
  username: string
  tier?: string
}

const tierColors: Record<string, string> = {
  Newbie: 'from-gray-400 to-gray-500',
  Social: 'from-green-400 to-green-500',
  Crew: 'from-blue-400 to-blue-500',
  Elite: 'from-purple-400 to-purple-500',
  Legendary: 'from-orange-400 to-orange-500',
}

const tierBadge: Record<string, string> = {
  Newbie: 'bg-gray-100 text-gray-500',
  Social: 'bg-green-50 text-green-500',
  Crew: 'bg-blue-50 text-blue-500',
  Elite: 'bg-purple-50 text-purple-500',
  Legendary: 'bg-orange-50 text-orange-500',
}

export default function UserAvatarMenu({ username, tier = 'Newbie' }: Props) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNav = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const handleLogout = async () => {
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const initial = username?.replace('@', '').charAt(0).toUpperCase() || 'U'
  const gradient = tierColors[tier] || tierColors.Newbie

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Ticket, label: 'My Tickets', href: '/tickets' },
    { icon: Users, label: 'My Groups', href: '/dashboard' },
    { icon: Star, label: 'Trust Score', href: '/dashboard' },
    { icon: Gift, label: 'Referrals', href: '/dashboard' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full hover:border-orange-300 transition-all"
      >
        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {initial}
        </div>
        <span className="text-sm font-semibold text-gray-700 max-w-[100px] truncate hidden sm:block">
          {username}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden z-[100]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {initial}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 truncate">{username}</div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${tierBadge[tier]}`}>
                  {tier}
                </span>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map(({ icon: Icon, label, href }) => (
              <button
                key={label}
                onClick={() => handleNav(href)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors text-left"
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}