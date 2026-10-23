'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus, Trash2, Briefcase, Check, X, AlertCircle, Loader2,
  Eye, EyeOff, ClipboardList, GripVertical
} from 'lucide-react'

interface JobField {
  id?: string
  label: string
  field_type: 'text' | 'textarea'
  is_required: boolean
}

interface JobOpening {
  id: string
  title: string
  department: string | null
  location: string | null
  employment_type: string | null
  pay: string | null
  summary: string
  description: string
  is_published: boolean
  created_at: string
  job_application_fields: JobField[]
}

const emptyForm = {
  title: '',
  department: '',
  location: '',
  employment_type: '',
  pay: '',
  summary: '',
  description: '',
  fields: [] as JobField[],
}

export default function AdminCareersPage() {
  const [openings, setOpenings] = useState<JobOpening[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0)

  const fetchOpenings = async () => {
    try {
      const res = await fetch('/api/admin/careers')
      const data = await res.json()
      if (data.openings) setOpenings(data.openings)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/admin/careers')
      .then(res => res.json())
      .then(data => {
        if (data.openings) setOpenings(data.openings)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/admin/careers/applications')
      .then(res => res.json())
      .then(data => {
        if (data.applications) {
          setPendingApplicationsCount(data.applications.filter((a: { status: string }) => a.status === 'new').length)
        }
      })
      .catch(() => {})
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (opening: JobOpening) => {
    setEditingId(opening.id)
    setForm({
      title: opening.title,
      department: opening.department || '',
      location: opening.location || '',
      employment_type: opening.employment_type || '',
      pay: opening.pay || '',
      summary: opening.summary,
      description: opening.description,
      fields: opening.job_application_fields.map(f => ({ label: f.label, field_type: f.field_type, is_required: f.is_required })),
    })
    setError('')
    setShowModal(true)
  }

  const addField = () => {
    setForm(prev => ({ ...prev, fields: [...prev.fields, { label: '', field_type: 'text', is_required: true }] }))
  }

  const updateField = (index: number, updates: Partial<JobField>) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...updates } : f),
    }))
  }

  const removeField = (index: number) => {
    setForm(prev => ({ ...prev, fields: prev.fields.filter((_, i) => i !== index) }))
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.summary.trim() || !form.description.trim()) {
      setError('Title, summary, and description are required')
      return
    }
    if (form.fields.some(f => !f.label.trim())) {
      setError('Every custom field needs a label')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(editingId ? `/api/admin/careers/${editingId}` : '/api/admin/careers', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(editingId ? 'Role updated' : 'Role created as a draft — publish it when ready')
        setShowModal(false)
        fetchOpenings()
        setTimeout(() => setSuccess(''), 4000)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (opening: JobOpening) => {
    setTogglingId(opening.id)
    try {
      const res = await fetch(`/api/admin/careers/${opening.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !opening.is_published }),
      })
      const data = await res.json()
      if (data.success) {
        setOpenings(prev => prev.map(o => o.id === opening.id ? { ...o, is_published: !opening.is_published } : o))
      }
    } catch {
      // ignore
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/careers/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setOpenings(prev => prev.filter(o => o.id !== id))
        setDeleteConfirmId(null)
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all shadow-xs"
  const labelClass = "block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5"

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Careers</h1>
          <p className="text-xs text-slate-500">Post, edit, and publish job openings. Each role can have its own custom application fields.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/dashboard/careers/applications"
            className="relative flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex-shrink-0"
          >
            <ClipboardList className="w-4 h-4" /> Review Applications
            {pendingApplicationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
            )}
          </Link>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> New Role
          </button>
        </div>
      </div>

      {success && (
        <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
            Loading roles...
          </div>
        ) : openings.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {openings.map(opening => (
              <div key={opening.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-bold text-slate-900 truncate">{opening.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                      opening.is_published
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${opening.is_published ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {opening.is_published ? 'Published' : 'Draft'}
                    </span>
                    {opening.job_application_fields.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {opening.job_application_fields.length} custom field{opening.job_application_fields.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    {opening.department && <span>{opening.department}</span>}
                    {opening.location && <span>· {opening.location}</span>}
                    {opening.employment_type && <span>· {opening.employment_type}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => togglePublish(opening)}
                    disabled={togglingId === opening.id}
                    title={opening.is_published ? 'Unpublish' : 'Publish to /careers'}
                    className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {opening.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(opening)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
                  >
                    Edit
                  </button>
                  {deleteConfirmId === opening.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(opening.id)}
                        disabled={deletingId === opening.id}
                        className="px-2.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors"
                      >
                        {deletingId === opening.id ? 'Removing...' : 'Confirm'}
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
                      onClick={() => setDeleteConfirmId(opening.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remove role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No roles yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Click &ldquo;New Role&rdquo; to post your first opening.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-left overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">{editingId ? 'Edit Role' : 'New Role'}</h3>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Job title <span className="text-rose-500">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior Backend Engineer" className={inputClass} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Department</label>
                  <input type="text" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="Engineering" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Lagos · Hybrid" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <input type="text" value={form.employment_type} onChange={e => setForm(p => ({ ...p, employment_type: e.target.value }))} placeholder="Full-time" className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Pay</label>
                <input type="text" value={form.pay} onChange={e => setForm(p => ({ ...p, pay: e.target.value }))} placeholder="₦400,000 – ₦600,000/month, or Negotiable" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Summary (shown on the roles list) <span className="text-rose-500">*</span></label>
                <textarea rows={2} value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} className={inputClass + ' resize-none'} />
              </div>

              <div>
                <label className={labelClass}>Full description <span className="text-rose-500">*</span></label>
                <textarea rows={5} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputClass + ' resize-none'} />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass + ' mb-0'}>Custom application fields</label>
                  <button type="button" onClick={addField} className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add field
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">Name and Email are always on the application form by default — add anything extra this role needs.</p>

                {form.fields.length > 0 && (
                  <div className="space-y-2">
                    {form.fields.map((field, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        <input
                          type="text"
                          value={field.label}
                          onChange={e => updateField(i, { label: e.target.value })}
                          placeholder="Field label, e.g. Portfolio link"
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-orange-500"
                        />
                        <select
                          value={field.field_type}
                          onChange={e => updateField(i, { field_type: e.target.value as 'text' | 'textarea' })}
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-orange-500"
                        >
                          <option value="text">Short answer</option>
                          <option value="textarea">Long answer</option>
                        </select>
                        <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 flex-shrink-0">
                          <input type="checkbox" checked={field.is_required} onChange={e => updateField(i, { is_required: e.target.checked })} />
                          Required
                        </label>
                        <button type="button" onClick={() => removeField(i)} className="p-1 text-slate-400 hover:text-rose-600 flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Role'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
