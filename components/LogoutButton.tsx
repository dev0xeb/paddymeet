'use client'

import { createClient } from '@/lib/supabase'
import { LogOut } from 'lucide-react'

interface Props {
  redirectTo?: string
  className?: string
  label?: string
}

export default function LogoutButton({
  redirectTo = '/',
  className,
  label = 'Log Out'
}: Props) {
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = redirectTo
  }

  return (
    <button
      onClick={handleLogout}
      className={className || 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all'}
    >
      <LogOut className="w-4 h-4" />
      {label}
    </button>
  )
}