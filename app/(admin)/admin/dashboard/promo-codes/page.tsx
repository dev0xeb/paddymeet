'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Copy, Check, Tag, Percent,
  Calendar, CheckCircle2, Clock, X, Loader2, Sparkles,
  AlertCircle, Search, Play, Pause, DollarSign, Users
} from 'lucide-react'

interface PromoCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [copiedCode, setCopiedCode] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form state
  const [formCode, setFormCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState<number | string>(10)
  const [maxUses, setMaxUses] = useState<number | string>(100)
  const [expiresAt, setExpiresAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchPromoCodes = async () => {
    try {
      const res = await fetch('/api/admin/promo-codes')
      const data = await res.json()
      if (data.codes) setCodes(data.codes)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const suffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setFormCode(`PM-${suffix}`)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCode.trim() || !discountValue) return
    setSaving(true)
    setFormError('')

    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formCode.trim().toUpperCase(),
          discount_type: discountType,
          discount_value: Number(discountValue),
          max_uses: maxUses ? Number(maxUses) : null,
          expires_at: expiresAt || null,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setFormError(data.error)
      } else {
        setFormCode('')
        setDiscountValue(10)
        setMaxUses(100)
        setExpiresAt('')
        setShowModal(false)
        fetchPromoCodes()
      }
    } catch {
      setFormError('Failed to create promo code. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      })
      const data = await res.json()
      if (data.success) {
        setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
      }
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setCodes(prev => prev.filter(c => c.id !== id))
        setDeleteConfirmId(null)
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const filteredCodes = codes.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  // Metrics
  const activeCount = codes.filter(c => c.is_active).length
  const totalUses = codes.reduce((sum, c) => sum + (c.uses_count || 0), 0)
  const avgDiscount = codes.length > 0
    ? Math.round(codes.reduce((sum, c) => sum + (c.discount_type === 'percentage' ? c.discount_value : 10), 0) / codes.length)
    : 0

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all"

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
            Promotions & Discounts
          </span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          paddy<span className="text-orange-500">meet</span>
        </Link>
      </nav>

      <div className="pt-16 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header & Create Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Promo & Discount Codes</h1>
            <p className="text-xs text-slate-500">Manage campaign voucher codes, percentage discounts, and redemptions.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search promo code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 shadow-sm min-w-[200px]"
              />
            </div>

            <button
              type="button"
              onClick={() => { setShowModal(true); setFormError('') }}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Create Promo Code
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Promo Codes', value: activeCount.toString(), subtext: `${codes.length} total created`, icon: Tag, color: 'emerald' },
            { label: 'Total Redemptions', value: totalUses.toString(), subtext: 'Applied across checkouts', icon: Users, color: 'blue' },
            { label: 'Avg Discount Value', value: `${avgDiscount}%`, subtext: 'Standard campaign savings', icon: Percent, color: 'orange' },
            { label: 'Campaign Health', value: '100% Active', subtext: 'Real-time gateway sync', icon: CheckCircle2, color: 'purple' },
          ].map(({ label, value, subtext, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  color === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">{value}</div>
              <div className="text-[11px] text-slate-400 font-medium">{subtext}</div>
            </div>
          ))}
        </div>

        {/* Promo Codes List / Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Active Campaign Vouchers</h2>
            <span className="text-xs text-slate-400">{filteredCodes.length} Codes</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
              Loading promo codes...
            </div>
          ) : filteredCodes.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredCodes.map((code) => {
                const max = code.max_uses || 100
                const percentUsed = Math.min(100, Math.round((code.uses_count / max) * 100))
                const isExpired = code.expires_at && new Date(code.expires_at) < new Date()

                return (
                  <div key={code.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    
                    {/* Left: Code & Details */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center flex-shrink-0">
                        <Tag className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            {code.code}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => handleCopy(code.code)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copy Promo Code"
                          >
                            {copiedCode === code.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            code.is_active && !isExpired
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {isExpired ? 'Expired' : code.is_active ? 'Active' : 'Paused'}
                          </span>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {code.discount_type === 'percentage' ? `${code.discount_value}% OFF` : `₦${code.discount_value.toLocaleString()} OFF`}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span>Usage: <strong>{code.uses_count}</strong> of {code.max_uses ? `${code.max_uses}` : '∞'} redeemed</span>
                          {code.expires_at && (
                            <span>· Expires {new Date(code.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {code.max_uses && (
                          <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full bg-orange-500 rounded-full transition-all"
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(code.id, code.is_active)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                          code.is_active
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {code.is_active ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Activate</>}
                      </button>

                      {deleteConfirmId === code.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(code.id)}
                            disabled={deletingId === code.id}
                            className="px-2.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors"
                          >
                            {deletingId === code.id ? 'Deleting...' : 'Confirm'}
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
                          onClick={() => setDeleteConfirmId(code.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete Promo Code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No promo codes found</p>
              <p className="text-xs text-slate-400 mt-0.5">Click &ldquo;Create Promo Code&rdquo; to launch a new discount campaign.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal: Create Promo Code */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Campaign Voucher</h3>
                <p className="text-xs text-slate-500">Configure discount code rates and redemption limits</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 my-4">
              {/* Code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Promo Code Name <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Generate Code
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. PADDYVIP20"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value.toUpperCase())}
                  className={inputClass + ' font-mono uppercase font-bold'}
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Discount Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      discountType === 'percentage'
                        ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-2 ring-orange-500/20 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      discountType === 'fixed'
                        ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-2 ring-orange-500/20 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Fixed Amount (₦)
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    {discountType === 'percentage' ? 'Discount %' : 'Amount (₦)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={discountType === 'percentage' ? '100' : '1000000'}
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="100 uses"
                    value={maxUses}
                    onChange={e => setMaxUses(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  className={inputClass}
                />
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Creating Code...' : 'Save & Publish Promo Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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