'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users, Tag, Star, Calendar, Ticket, DollarSign, Shield, Bell,
  Settings, BarChart2, Flag, Menu,
  Megaphone, Search, UserCheck, Database
} from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import Logo from '@/components/Logo'

interface Props {
  fullName: string
  department: string
  pendingEventsCount: number
  pendingOrganisersCount: number
}

const navItems = [
  { icon: BarChart2, label: 'Overview', href: '/admin/dashboard', depts: ['super_admin', 'support', 'finance', 'marketing', 'operations'] },
  { icon: Users, label: 'Users', href: '/admin/dashboard/users', depts: ['super_admin', 'support', 'operations'] },
  { icon: UserCheck, label: 'Organisers', href: '/admin/dashboard/organisers', badgeKey: 'pendingOrganisersCount', depts: ['super_admin', 'support', 'operations'] },
  { icon: Calendar, label: 'Events', href: '/admin/dashboard/events', badgeKey: 'pendingEventsCount', depts: ['super_admin', 'support', 'marketing', 'operations'] },
  { icon: Ticket, label: 'Tickets', href: '/admin/dashboard/tickets', depts: ['super_admin', 'support', 'operations'] },
  { icon: DollarSign, label: 'Payments', href: '/admin/dashboard/payments', depts: ['super_admin', 'finance'] },
  { icon: BarChart2, label: 'Revenue', href: '/admin/dashboard/revenue', depts: ['super_admin', 'finance'] },
  { icon: Megaphone, label: 'Announcements', href: '/admin/dashboard/announcements', depts: ['super_admin', 'marketing'] },
  { icon: Search, label: 'AI Scanner', href: '/admin/dashboard/scanner', depts: ['super_admin', 'marketing'] },
  { icon: Flag, label: 'Reports', href: '/admin/dashboard/reports', depts: ['super_admin', 'support'] },
  { icon: Shield, label: 'Trust Scores', href: '/admin/dashboard/trust', depts: ['super_admin', 'support'] },
  { icon: Database, label: 'Support Tickets', href: '/admin/dashboard/support', depts: ['super_admin', 'support'] },
  { icon: DollarSign, label: 'Payouts', href: '/admin/dashboard/payouts', depts: ['super_admin', 'finance'] },
  { icon: Tag, label: 'Promo Codes', href: '/admin/dashboard/promo-codes', depts: ['super_admin', 'marketing'] },
  { icon: Star, label: 'Featured', href: '/admin/dashboard/featured', depts: ['super_admin', 'marketing'] },
  { icon: Settings, label: 'Platform Settings', href: '/admin/dashboard/platform-settings', depts: ['super_admin'] },
]

export default function AdminSidebar({ fullName, department, pendingEventsCount, pendingOrganisersCount }: Props) {
  const pathname = usePathname()
  const isSuperAdmin = department === 'super_admin'
  const visibleNavItems = navItems.filter(item => item.depts.includes(department))
  const badgeValues: Record<string, number> = { pendingEventsCount, pendingOrganisersCount }
  const totalPending = pendingEventsCount + pendingOrganisersCount

  return (
    <>
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <label
            htmlFor="admin-sidebar-toggle"
            className="md:hidden w-9 h-9 flex-shrink-0 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </label>
          <Link href="/" className="text-lg font-bold text-white tracking-tight flex-shrink-0">
            <Logo theme="white" className="h-6 w-auto" />
          </Link>
          <div className="hidden sm:block h-5 w-px bg-slate-700" />
          <span className="hidden sm:inline-flex text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Admin Portal
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <Link
            href="/admin/dashboard/events"
            className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:border-slate-600 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {totalPending > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {totalPending}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {fullName?.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-white">{fullName || 'Admin'}</span>
              <span className="ml-2 text-[10px] text-orange-400 font-medium capitalize bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                {department?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile sidebar toggle — pure CSS checkbox hack, no client JS needed. Must be
          a direct sibling (in DOM order) of anything using peer-checked: below, since
          that's a CSS general-sibling-combinator relationship, not a descendant one. */}
      <input type="checkbox" id="admin-sidebar-toggle" className="peer hidden" />

      {/* Backdrop — dims the page behind the open mobile sidebar, tap to close */}
      <label
        htmlFor="admin-sidebar-toggle"
        className="hidden peer-checked:block md:!hidden fixed inset-0 bg-black/40 z-40"
      />

      {/* Sidebar — off-canvas on mobile, toggled by the checkbox above; always visible from md up */}
      <aside className="w-64 md:w-56 fixed top-16 left-0 bottom-0 bg-slate-900 border-r border-slate-800 flex flex-col py-5 px-3 z-50 -translate-x-full peer-checked:translate-x-0 md:translate-x-0 transition-transform duration-200 ease-out">
        <div className="space-y-0.5 flex-1 overflow-y-auto pr-1">
          {visibleNavItems.map(({ icon: Icon, label, href, badgeKey }) => {
            const active = href === '/admin/dashboard' ? pathname === href : pathname.startsWith(href)
            const badge = badgeKey ? badgeValues[badgeKey] : 0
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                </div>
                {badge > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-orange-500 text-white">
                    {badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </div>

        <div className="border-t border-slate-800 pt-3 space-y-0.5">
          {isSuperAdmin && (
            <Link
              href="/admin/dashboard/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                pathname.startsWith('/admin/dashboard/settings')
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" /> Settings & Team
            </Link>
          )}
          <LogoutButton redirectTo="/admin-login" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-all" />
        </div>
      </aside>
    </>
  )
}
