'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Copy, Check, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface PromoCode {
  id: string
  code: string
  discount_type: string
  discount_value: number
  max_uses: number
  uses_count: number
  expires_at: string
  is_active: boolean
  created_at: string
}

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState('')
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    max_uses: 100,
    expires_at: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('promo_codes').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setCodes(data); setLoading(false) })
  }, [])

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const code = 'PM' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setForm(prev => ({ ...prev, code }))
  }

  const handleCreate = async () => {
    if (!form.code || !form.discount_value) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('promo_codes').insert({
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      max_uses: form.max_uses,
      uses_count: 0,
      expires_at: form.expires_at || null,
      is_active: true,
    }).select().single()
    if (data) { setCodes(prev => [data, ...prev]); setShowForm(false) }
    setSaving(false)
  }

  const toggleActive = async (id: string, current: boolean) => {
    const supabase = createClient()
    await supabase.from('promo_codes').update({ is_active: !current }).eq('id', id)
    setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
  }

  const deleteCode = async (id: string) => {
    const supabase = createClient()
    await supabase.from('promo_codes').delete().eq('id', id)
    setCodes(prev => prev.filter(c => c.id !== id))
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(''), 2000)
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 transition-all"

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="h-5 w-px bg-gray-700" />
          <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Promo Codes</span>
        </div>
        <Link href="/" className="text-lg font-bold text-white tracking-tight">paddy<span className="text-orange-500">meet</span></Link>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
          <Plus className="w-4 h-4" /> New Code
        </button>
      </nav>

      <div className="pt-16 max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Promo Codes</h1>
          <p className="text-sm text-gray-500">Create and manage discount codes for events</p>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-extrabold text-gray-900 mb-4">Create New Promo Code</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Code</label>
                <div className="flex gap-2">
                  <input type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. PMLAUNCH20" className={inputClass} />
                  <button onClick={generateCode} className="px-3 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-colors flex-shrink-0">
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Discount Type</label>
                <select value={form.discount_type} onChange={e => setForm(p => ({ ...p, discount_type: e.target.value }))} className={inputClass + ' appearance-none'}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₦)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {form.discount_type === 'percentage' ? 'Discount %' : 'Discount ₦'}
                </label>
                <input type="number" value={form.discount_value} onChange={e => setForm(p => ({ ...p, discount_value: parseInt(e.target.value) }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max Uses</label>
                <input type="number" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: parseInt(e.target.value) }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expiry Date (optional)</label>
                <input type="date" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:border-gray-300 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60">
                {saving ? 'Creating...' : 'Create Code'}
              </button>
            </div>
          </div>
        )}

        {/* Codes list */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : codes.length > 0 ? (
            <div className="space-y-3">
              {codes.map(code => (
                <div key={code.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Tag className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-extrabold text-gray-900 font-mono">{code.code}</span>
                      <button onClick={() => copyCode(code.code)} className="text-gray-400 hover:text-gray-600">
                        {copied === code.code ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${code.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {code.discount_type === 'percentage' ? `${code.discount_value}% off` : `₦${code.discount_value} off`}
                      {' · '}{code.uses_count}/{code.max_uses} uses
                      {code.expires_at && ` · Expires ${new Date(code.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(code.id, code.is_active)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                        code.is_active ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-50 border border-green-200 text-green-600 hover:bg-green-100'
                      }`}>
                      {code.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => deleteCode(code.id)} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Tag className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-3">No promo codes yet</p>
              <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors">
                Create First Code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}