'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Shield, Clock, Check, X, Eye, EyeOff,
  UserPlus, Sparkles, AlertCircle, Loader2, RefreshCw, Users, Lock, ChevronRight
} from 'lucide-react'

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
  { value: 'super_admin', label: 'Super Admin', desc: 'Full root access to all platform controls, finance, and settings', color: 'orange' },
  { value: 'support', label: 'Support', desc: 'Manage attendee users, support tickets, disputes, and trust scores', color: 'blue' },
  { value: 'finance', label: 'Finance', desc: 'Access payments, ledger, financial export, and host payout disbursements', color: 'emerald' },
  { value: 'marketing', label: 'Marketing', desc: 'Editorial spotlights, discount promo codes, and broadcast announcements', color: 'purple' },
  { value: 'operations', label: 'Operations', desc: 'Manage events, organizers, ticket verification, and venue scanner', color: 'slate' },
]

const deptStyles: Record<string, string> = {
  super_admin: 'bg-orange-50 text-orange-700 border-orange-200',
  support: 'bg-blue-50 text-blue-700 border-blue-200',
  finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  marketing: 'bg-purple-50 text-purple-700 border-purple-200',
  operations: 'bg-slate-100 text-slate-700 border-slate-200',
}

export default function AdminSettingsPage() {
  const [team, setTeam] = useState<AdminMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDept, setSelectedDept] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [newMember, setNewMember] = useState({
    full_name: '',
    email: '',
    password: '',
    department: 'support',
  })

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/admin/team')
      const data = await res.json()
      if (data.team) setTeam(data.team)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&'
    const generated = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setNewMember(prev => ({ ...prev, password: generated }))
    setShowPassword(true)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMember.full_name || !newMember.email || !newMember.password) {
      setError('Please fill in all required fields')
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
        setShowAddModal(false)
        setNewMember({ full_name: '', email: '', password: '', department: 'support' })
        fetchTeam()
        setTimeout(() => setSuccess(''), 4000)
      }
    } catch {
      setError('Failed to add team member. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  const handleToggleStatus = async (member: AdminMember) => {
    if (member.department === 'super_admin') return
    try {
      const res = await fetch(`/api/admin/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !member.is_active }),
      })
      const data = await res.json()
      if (data.success) {
        setTeam(prev => prev.map(m => m.id === member.id ? { ...m, is_active: !member.is_active } : m))
      }
    } catch {
      // ignore
    }
  }

  const handleRoleChange = async (memberId: string, newDept: string) => {
    try {
      const res = await fetch(`/api/admin/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: newDept }),
      })
      const data = await res.json()
      if (data.success) {
        setTeam(prev => prev.map(m => m.id === memberId ? { ...m, department: newDept } : m))
      }
    } catch {
      // ignore
    }
  }

  const handleRemove = async (memberId: string, memberName: string) => {
    setDeletingId(memberId)
    try {
      const res = await fetch(`/api/admin/team/${memberId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(`${memberName} has been removed from the team`)
        setTeam(prev => prev.filter(m => m.id !== memberId))
        setDeleteConfirmId(null)
        setTimeout(() => setSuccess(''), 4000)
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredTeam = team.filter(m =>
    selectedDept === 'all' ? true : m.department === selectedDept
  )

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all shadow-xs"

  return (
    <div className="min-h-screen bg-slate-50 antialiased">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-slate-700" />
          <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Team & Staff Access
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Team & Access Control</h1>
            <p className="text-xs text-slate-500">Manage administrator roles, invite team members, and enforce department RBAC policies.</p>
          </div>

          <button
            type="button"
            onClick={() => { setShowAddModal(true); setError('') }}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Invite Staff Member
          </button>
        </div>

        {success && (
          <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Department Filter Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedDept('all')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              selectedDept === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="text-lg font-extrabold mb-0.5">{team.length}</div>
            <div className={`text-[11px] font-bold ${selectedDept === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
              All Staff
            </div>
          </button>

          {departments.map(dept => {
            const count = team.filter(m => m.department === dept.value).length
            const isSelected = selectedDept === dept.value
            return (
              <button
                key={dept.value}
                type="button"
                onClick={() => setSelectedDept(dept.value)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="text-lg font-extrabold mb-0.5">{count}</div>
                <div className={`text-[11px] font-bold ${
                  isSelected ? 'text-slate-300' :
                  dept.value === 'super_admin' ? 'text-orange-600' :
                  dept.value === 'support' ? 'text-blue-600' :
                  dept.value === 'finance' ? 'text-emerald-600' :
                  dept.value === 'marketing' ? 'text-purple-600' : 'text-slate-600'
                }`}>
                  {dept.label}
                </div>
              </button>
            )
          })}
        </div>

        {/* Team Members List / Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm mb-8">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              {selectedDept === 'all' ? 'Active Team Roster' : `${departments.find(d => d.value === selectedDept)?.label} Roster`}
            </h2>
            <span className="text-xs text-slate-400">{filteredTeam.length} Members</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
              Loading team roster...
            </div>
          ) : filteredTeam.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredTeam.map((member) => (
                <div
                  key={member.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Left: Avatar & Name */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-sm flex items-center justify-center shadow-xs flex-shrink-0">
                      {member.full_name?.charAt(0) || 'A'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-slate-900 truncate">{member.full_name}</span>
                        
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${deptStyles[member.department] || deptStyles.operations}`}>
                          {departments.find(d => d.value === member.department)?.label || member.department}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(member)}
                          disabled={member.department === 'super_admin'}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                            member.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          } ${member.department === 'super_admin' ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {member.is_active ? 'Active' : 'Suspended'}
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>{member.email}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Last login: {member.last_login
                            ? new Date(member.last_login).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    {member.department !== 'super_admin' ? (
                      <>
                        <select
                          value={member.department}
                          onChange={e => handleRoleChange(member.id, e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-orange-500 cursor-pointer"
                        >
                          {departments.filter(d => d.value !== 'super_admin').map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>

                        {deleteConfirmId === member.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleRemove(member.id, member.full_name)}
                              disabled={deletingId === member.id}
                              className="px-2.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors"
                            >
                              {deletingId === member.id ? 'Removing...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(member.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Remove Staff Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200/60">
                        <Shield className="w-3.5 h-3.5" /> Root Owner
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No staff members in this department</p>
              <p className="text-xs text-slate-400 mt-0.5">Click &ldquo;Invite Staff Member&rdquo; to add a team member.</p>
            </div>
          )}
        </div>

        {/* Access Levels Matrix */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-bold text-slate-900">Department Role & Permission Policies</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {departments.map(dept => (
              <div key={dept.value} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${deptStyles[dept.value]}`}>
                    {dept.label}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    {team.filter(m => m.department === dept.value).length} Active
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {dept.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal: Invite Staff Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Invite Staff Member</h3>
                <p className="text-xs text-slate-500">Create an internal administrator account and assign a department role</p>
              </div>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 my-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tunde Adeyemi"
                    value={newMember.full_name}
                    onChange={e => setNewMember(prev => ({ ...prev, full_name: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Work Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tunde@paddymeet.com"
                    value={newMember.email}
                    onChange={e => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Temporary Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 8 characters"
                    value={newMember.password}
                    onChange={e => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                    className={inputClass + ' pr-10 font-mono'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Assign Department Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {departments.filter(d => d.value !== 'super_admin').map(dept => (
                    <div
                      key={dept.value}
                      onClick={() => setNewMember(prev => ({ ...prev, department: dept.value }))}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        newMember.department === dept.value
                          ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20'
                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{dept.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{dept.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {adding ? 'Creating Account...' : 'Create Staff Member'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}