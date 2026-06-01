'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Shield, Clock, Check, X, Eye, EyeOff } from 'lucide-react'

interface AdminMember {
  id: string
  full_name: string
  email: string
  department: string
  is_active: boolean
  last_login: string | null
  created_at: string
}

const departments = [
  { value: 'super_admin', label: 'Super Admin', desc: 'Full access to everything' },
  { value: 'support', label: 'Support', desc: 'Users, tickets, reports' },
  { value: 'finance', label: 'Finance', desc: 'Payments and revenue' },
  { value: 'marketing', label: 'Marketing', desc: 'Events, announcements, scanner' },
  { value: 'operations', label: 'Operations', desc: 'Users, organisers, events' },
]

const deptColors: Record<string, string> = {
  super_admin: 'bg-orange-50 text-orange-600 border-orange-200',
  support: 'bg-blue-50 text-blue-600 border-blue-200',
  finance: 'bg-green-50 text-green-600 border-green-200',
  marketing: 'bg-purple-50 text-purple-600 border-purple-200',
  operations: 'bg-gray-50 text-gray-600 border-gray-200',
}

async function getTeam(): Promise<AdminMember[]> {
  try {
    const res = await fetch('/api/admin/team')
    const data = await res.json()
    return data.team || []
  } catch {
    return []
  }
}

export default function AdminSettingsPage() {
  const [team, setTeam] = useState<AdminMember[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [newMember, setNewMember] = useState({
    full_name: '',
    email: '',
    password: '',
    department: 'support',
  })

  useEffect(() => {
    getTeam().then(data => {
      setTeam(data)
      setLoaded(true)
    })
  }, [])

  const refreshTeam = () => {
    getTeam().then(data => setTeam(data))
  }

  const handleAdd = async () => {
    if (!newMember.full_name || !newMember.email || !newMember.password) {
      setError('Please fill in all fields')
      return
    }
    setAdding(true)
    setError('')
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(`${newMember.full_name} has been added to the team`)
        setShowAddForm(false)
        setNewMember({ full_name: '', email: '', password: '', department: 'support' })
        refreshTeam()
        setTimeout(() => setSuccess(''), 4000)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setAdding(false)
  }

  const handleRevoke = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the admin team?`)) return
    try {
      const res = await fetch(`/api/admin/team/${memberId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(`${memberName} has been removed`)
        refreshTeam()
        setTimeout(() => setSuccess(''), 4000)
      }
    } catch {
      setError('Something went wrong.')
    }
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition-all"

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Team Management
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Team Management</h1>
            <p className="text-sm text-gray-500">Manage admin accounts and department access</p>
          </div>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setError('') }}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Team Member
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl mb-5">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-green-700">{success}</span>
          </div>
        )}

        {/* Add member form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-extrabold text-gray-900">Add New Team Member</h2>
              <button onClick={() => { setShowAddForm(false); setError('') }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name *</label>
                <input type="text" placeholder="e.g. Tunde Adeyemi"
                  value={newMember.full_name}
                  onChange={e => setNewMember(prev => ({ ...prev, full_name: e.target.value }))}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address *</label>
                <input type="email" placeholder="tunde@paddymeet.com"
                  value={newMember.email}
                  onChange={e => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                    value={newMember.password}
                    onChange={e => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                    className={inputClass + ' pr-10'} />
                  <button onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Department *</label>
                <select value={newMember.department}
                  onChange={e => setNewMember(prev => ({ ...prev, department: e.target.value }))}
                  className={inputClass + ' appearance-none'}>
                  {departments.filter(d => d.value !== 'super_admin').map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {departments.filter(d => d.value !== 'super_admin').map(d => (
                <div key={d.value}
                  onClick={() => setNewMember(prev => ({ ...prev, department: d.value }))}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    newMember.department === d.value ? 'border-orange-300 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                  }`}>
                  <div className="text-xs font-bold text-gray-900">{d.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{d.desc}</div>
                </div>
              ))}
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">{error}</div>}

            <div className="flex gap-3">
              <button onClick={() => { setShowAddForm(false); setError('') }}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={adding}
                className="flex-1 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {adding ? 'Adding...' : 'Add Team Member'}
                {!adding && <Plus className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Department overview */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {departments.map(dept => {
            const count = team.filter(m => m.department === dept.value).length
            return (
              <div key={dept.value} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <div className="text-xl font-extrabold text-gray-900 mb-0.5">{count}</div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full border inline-block ${deptColors[dept.value]}`}>
                  {dept.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Team table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
            {['Member', 'Department', 'Status', 'Last Login', 'Actions'].map(h => (
              <div key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</div>
            ))}
          </div>

          {!loaded ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Loading team...</p>
            </div>
          ) : team.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {team.map((member) => (
                <div key={member.id} className="grid grid-cols-5 gap-4 px-5 py-4 hover:bg-gray-50 transition-colors items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {member.full_name?.charAt(0) || 'A'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{member.full_name}</div>
                      <div className="text-xs text-gray-400 truncate">{member.email}</div>
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${deptColors[member.department] || deptColors.operations}`}>
                      {departments.find(d => d.value === member.department)?.label || member.department}
                    </span>
                  </div>
                  <div>
                    <span className={`flex items-center gap-1 text-xs font-bold w-fit ${member.is_active ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    {member.last_login
                      ? new Date(member.last_login).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Never'}
                  </div>
                  <div className="flex items-center gap-2">
                    {member.department !== 'super_admin' ? (
                      <button onClick={() => handleRevoke(member.id, member.full_name)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
                        <Shield className="w-3 h-3" /> Super Admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-400">No team members yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first team member above</p>
            </div>
          )}
        </div>

        {/* Access levels */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-5">
          <h2 className="text-sm font-extrabold text-gray-900 mb-4">Department Access Levels</h2>
          <div className="space-y-3">
            {departments.map(dept => (
              <div key={dept.value} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${deptColors[dept.value]}`}>
                  {dept.label}
                </span>
                <div className="text-xs text-gray-600 leading-relaxed">
                  {dept.value === 'super_admin' && 'Full access to all sections including team management, all reports and system settings.'}
                  {dept.value === 'support' && 'Access to users, organisers, events, tickets, reports, trust scores and support tickets.'}
                  {dept.value === 'finance' && 'Access to payments, revenue reports and payout management only.'}
                  {dept.value === 'marketing' && 'Access to events, announcements tool and AI event scanner.'}
                  {dept.value === 'operations' && 'Access to users, organisers, events and ticket management.'}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}