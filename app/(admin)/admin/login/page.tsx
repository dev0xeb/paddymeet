'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Sign in
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Invalid credentials.')
      setLoading(false)
      return
    }

    // Check if user is in admin_team
    const { data: admin } = await supabase
      .from('admin_team')
      .select('id, department')
      .eq('id', data.user.id)
      .single()

    if (!admin) {
      await supabase.auth.signOut()
      setError('Access denied.')
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
  }

  const inputClass = "w-full px-4 py-3.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-orange-500 focus:bg-gray-750 transition-all placeholder:text-gray-500"

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-orange-500" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            paddy<span className="text-orange-500">meet</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">

          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className={inputClass}
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className={inputClass + ' pr-12'}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-3.5 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center ${
              loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </div>

      </div>
    </div>
  )
}