'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Ticket, Users, TrendingUp,
  CreditCard, BarChart2, Settings, Bell, Plus,
  LogOut, ChevronDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Props {
  orgName: string
  pendingEvents?: number
}

const navLinks = [
  { icon: LayoutDashboard, label: 'Overview', href: '/organiser/dashboard' },
  { icon: Calendar, label: 'My Events', href: '/organiser/dashboard/events' },
  { icon: Ticket, label: 'Ticket Sales', href: '/organiser/dashboard/tickets' },
  { icon: Users, label: 'Attendees', href: '/organiser/dashboard/attendees' },
  { icon: TrendingUp, label: 'Revenue', href: '/organiser/dashboard/revenue' },
  { icon: CreditCard, label: 'Payouts', href: '/organiser/dashboard/payouts' },
  { icon: BarChart2, label: 'Reports', href: '/organiser/dashboard/reports' },
  { icon: Settings, label: 'Settings', href: '/organiser/dashboard/settings' },
]

export default function OrganiserNav({ orgName, pendingEvents = 0 }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleNav = (href: string) => {
    setMenuOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
            paddy<span className="text-orange-500">meet</span>
          </Link>
          <span className="hidden sm:block text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Organiser
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/organiser/dashboard/events/new"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Event
          </Link>

          <button className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 transition-colors">
            <Bell className="w-4 h-4" />
            {pendingEvents > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center font-bold border-2 border-white">
                {pendingEvents}
              </span>
            )}
          </button>

          {/* Avatar dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-full hover:border-blue-300 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {orgName?.charAt(0) || 'O'}
              </div>
              <span className="text-xs font-semibold text-gray-700 max-w-[80px] truncate hidden sm:block">
                {orgName}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden z-[100]">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {orgName?.charAt(0) || 'O'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{orgName}</div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                        Organiser
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nav links */}
                <div className="py-1">
                  {navLinks.map(({ icon: Icon, label, href }) => (
                    <button
                      key={label}
                      onClick={() => handleNav(href)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
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
        </div>
      </nav>

      {/* Mobile horizontal scroll nav */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-100 md:hidden">
        <div className="flex gap-1.5 px-3 py-2 overflow-x-auto">
          {navLinks.map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex-shrink-0">
              <Icon className="w-3 h-3" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}