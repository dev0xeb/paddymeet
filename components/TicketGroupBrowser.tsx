'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Clock, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import GroupSharePaymentModal from './GroupSharePaymentModal'

interface TicketType {
  id: string
  name: string
  price: number
  group_size: number
  quantity: number
  quantity_sold: number
  group_deadline: string | null
}

interface GroupRow {
  id: string
  name: string
  max_members: number
  status: string
  paidCount: number
}

interface Props {
  eventId: string
  eventTitle: string
  ticketType: TicketType
  userId: string
  userEmail: string
}

export default function TicketGroupBrowser({ eventId, eventTitle, ticketType, userId, userEmail }: Props) {
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const [paymentModal, setPaymentModal] = useState<{ groupId: string, groupName: string, amount: number, needsPayment: boolean } | null>(null)

  const fetchGroups = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('groups')
      .select('id, name, max_members, status, group_members(payment_status)')
      .eq('ticket_type_id', ticketType.id)
      .eq('status', 'recruiting')
      .order('created_at', { ascending: false })

    if (data) {
      const rows: GroupRow[] = data.map((g) => ({
        id: g.id,
        name: g.name,
        max_members: g.max_members,
        status: g.status,
        paidCount: (g.group_members as { payment_status: string }[] || []).filter(m => m.payment_status === 'paid').length,
      }))
      setGroups(rows)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchGroups()
  }, [ticketType.id])

  const deadlinePassed = ticketType.group_deadline ? new Date(ticketType.group_deadline) < new Date() : false
  const soldOut = (ticketType.quantity_sold || 0) >= ticketType.quantity

  const handleCreate = async () => {
    if (!newGroupName.trim()) { setError('Please enter a group name'); return }
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/groups/create-ticket-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, ticket_type_id: ticketType.id, name: newGroupName }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setShowCreate(false)
        setNewGroupName('')
        setPaymentModal({
          groupId: data.group.id,
          groupName: data.group.name,
          amount: data.amount_per_member,
          needsPayment: data.needs_payment,
        })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setCreating(false)
  }

  const handleJoin = async (group: GroupRow) => {
    setError('')
    try {
      const res = await fetch(`/api/groups/${group.id}/join-ticket-group`, { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setPaymentModal({
          groupId: group.id,
          groupName: group.name,
          amount: data.amount_per_member,
          needsPayment: data.needs_payment,
        })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-extrabold text-gray-900">{ticketType.name} Groups</h3>
        <span className="text-xs font-bold text-gray-400">₦{ticketType.price.toLocaleString()} / {ticketType.group_size}</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        ₦{Math.round(ticketType.price / ticketType.group_size).toLocaleString()} per person · {ticketType.group_size} people per group
      </p>

      {ticketType.group_deadline && (
        <div className={`flex items-center gap-2 text-xs font-semibold mb-4 ${deadlinePassed ? 'text-red-500' : 'text-orange-500'}`}>
          <Clock className="w-3.5 h-3.5" />
          {deadlinePassed
            ? 'Group sign-ups have closed'
            : `Sign-ups close ${new Date(ticketType.group_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
        </div>
      )}

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {groups.length > 0 ? groups.map(group => (
            <div key={group.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {group.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-gray-900 truncate">{group.name}</div>
                <div className="text-xs text-gray-500">{group.paidCount}/{group.max_members} joined</div>
              </div>
              <button
                onClick={() => handleJoin(group)}
                disabled={deadlinePassed || soldOut || group.paidCount >= group.max_members}
                className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 flex-shrink-0"
              >
                Join
              </button>
            </div>
          )) : (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">No open groups yet. Be the first to start one!</p>
            </div>
          )}
        </div>
      )}

      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          disabled={deadlinePassed || soldOut}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-orange-50 border border-orange-200 text-orange-500 text-xs font-bold rounded-xl hover:bg-orange-100 transition-colors disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> Start a New Group
        </button>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Name your group"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-orange-400 transition-all"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:border-gray-300 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {creating ? 'Creating...' : <>Create <ArrowRight className="w-3 h-3" /></>}
            </button>
          </div>
        </div>
      )}

      {paymentModal && (
        <GroupSharePaymentModal
          groupId={paymentModal.groupId}
          groupName={paymentModal.groupName}
          eventTitle={eventTitle}
          amountPerMember={paymentModal.amount}
          needsPayment={paymentModal.needsPayment}
          userEmail={userEmail}
          onClose={() => setPaymentModal(null)}
          onComplete={() => {
            setPaymentModal(null)
            fetchGroups()
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}