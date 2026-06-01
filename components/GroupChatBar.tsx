'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Minus, Send, Users, ChevronDown } from 'lucide-react'
import { useGroupChat } from '@/context/GroupChatContext'
import { createClient } from '@/lib/supabase'

interface Message {
  id: string
  message: string
  sender_id: string
  created_at: string
  sender_username?: string
}

interface GroupWindowProps {
  groupId: string
  groupName: string
  eventTitle: string
  minimized: boolean
  onClose: () => void
  onToggleMinimize: () => void
}

function GroupWindow({ groupId, groupName, eventTitle, minimized, onClose, onToggleMinimize }: GroupWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [memberCount, setMemberCount] = useState(0)
  const [unread, setUnread] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      // Load messages with sender usernames
      const { data: msgs } = await supabase
        .from('group_messages')
        .select('*, users(username)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (msgs) {
        setMessages(msgs.map(m => ({
          ...m,
          sender_username: m.users?.username || 'Unknown'
        })))
      }

      // Get member count
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
      setMemberCount(count || 0)
    }

    init()

    // Subscribe to new messages
    const channel = supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      }, async (payload) => {
        const newMsg = payload.new as Message
        // Fetch sender username
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', newMsg.sender_id)
          .single()

        setMessages(prev => [...prev, {
          ...newMsg,
          sender_username: userData?.username || 'Unknown'
        }])

        if (minimized) setUnread(prev => prev + 1)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, minimized])

  useEffect(() => {
    if (!minimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      setUnread(0)
    }
  }, [messages, minimized])

  const handleSend = async () => {
    if (!input.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('group_messages').insert({
      group_id: groupId,
      sender_id: user.id,
      message: input.trim(),
    })
    setInput('')
  }

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-t-xl shadow-lg overflow-hidden"
      style={{ width: '280px' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 bg-gray-900 cursor-pointer select-none"
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {groupName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{groupName}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />
              {memberCount} members
            </div>
          </div>
          {unread > 0 && minimized && (
            <span className="ml-1 w-4 h-4 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button
            onClick={e => { e.stopPropagation(); onToggleMinimize() }}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            {minimized ? <ChevronDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onClose() }}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Chat body */}
      {!minimized && (
        <>
          {/* Event label */}
          <div className="px-3 py-1.5 bg-orange-50 border-b border-orange-100">
            <span className="text-xs text-orange-600 font-semibold truncate block">{eventTitle}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50" style={{ height: '280px' }}>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-400">No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender_id === currentUserId
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <span className="text-xs text-gray-400 mb-0.5 px-1">{msg.sender_username}</span>
                    )}
                    <div className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-orange-500 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-xs text-gray-400 mt-0.5 px-1">
                      {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-2.5 bg-white border-t border-gray-100">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-900 outline-none focus:border-orange-400 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function GroupChatBar() {
  const { openGroups, closeGroup, toggleMinimize } = useGroupChat()

  if (openGroups.length === 0) return null

  return (
    <div className="fixed bottom-0 right-6 z-40 flex items-end gap-2">
      {openGroups.map(group => (
        <GroupWindow
          key={group.id}
          groupId={group.id}
          groupName={group.name}
          eventTitle={group.event_title}
          minimized={group.minimized}
          onClose={() => closeGroup(group.id)}
          onToggleMinimize={() => toggleMinimize(group.id)}
        />
      ))}
    </div>
  )
}