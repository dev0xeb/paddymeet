'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Minus, Send, Users, ChevronDown } from 'lucide-react'
import { useGroupChat } from '@/context/GroupChatContext'
import { createClient } from '@/lib/supabase'

interface Message {
  id: string
  message: string
  user_id: string
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
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentUsername, setCurrentUsername] = useState('')
  const [memberCount, setMemberCount] = useState(0)
  const [unread, setUnread] = useState(0)
  const [isMember, setIsMember] = useState(false)
  const [joining, setJoining] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const { data: profile } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single()
        if (profile) setCurrentUsername(profile.username)
      }

      // Load messages
      const { data: msgs, error } = await supabase
        .from('group_messages')
        .select('id, message, user_id, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      if (msgs && msgs.length > 0) {
        const senderIds = [...new Set(msgs.map(m => m.user_id))]
        const { data: users } = await supabase
          .from('users')
          .select('id, username')
          .in('id', senderIds)

        const usernameMap: Record<string, string> = {}
        users?.forEach(u => { usernameMap[u.id] = u.username })

        setMessages(msgs.map(m => ({
          ...m,
          sender_username: usernameMap[m.user_id] || 'Unknown'
        })))
      }

      // Member count
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
      setMemberCount(count || 0)

      // Check membership
      if (user) {
        const { data: membership } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .maybeSingle()
        setIsMember(!!membership)
      }
    }

    init()

    // Realtime subscription
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      }, async (payload) => {
        const newMsg = payload.new as Message
        // Don't add if already in state (we add own messages immediately on send)
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev
          return [...prev, { ...newMsg, sender_username: 'Loading...' }]
        })
        // Fetch username
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', newMsg.user_id)
          .single()
        if (userData) {
          setMessages(prev => prev.map(m =>
            m.id === newMsg.id ? { ...m, sender_username: userData.username } : m
          ))
        }
        if (minimized) setUnread(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId, minimized])

  useEffect(() => {
    if (!minimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      setUnread(0)
    }
  }, [messages, minimized])

  const handleJoin = async () => {
    setJoining(true)
    const supabase = supabaseRef.current
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: user.id,
      role: 'member',
    })

    if (!error) {
      setIsMember(true)
      setMemberCount(prev => prev + 1)
    }
    setJoining(false)
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    const supabase = supabaseRef.current
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSending(false); return }

    const tempId = `temp-${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      message: input.trim(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      sender_username: currentUsername || 'You',
    }

    // Add to state immediately
    setMessages(prev => [...prev, tempMessage])
    setInput('')

    const { data, error } = await supabase
      .from('group_messages')
      .insert({ group_id: groupId, user_id: user.id, message: tempMessage.message })
      .select('id')
      .single()

    if (error) {
      console.error('Send error:', error)
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } else if (data) {
      // Replace temp id with real id
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m))
    }

    setSending(false)
  }

  const getInitial = (username: string) => username?.charAt(0)?.toUpperCase() || '?'
  const getColor = (userId: string) => {
    const colors = ['bg-orange-400', 'bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-teal-500']
    const index = userId ? userId.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-t-2xl shadow-2xl overflow-hidden"
      style={{ width: '360px' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 cursor-pointer select-none"
        onClick={onToggleMinimize}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {groupName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{groupName}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Users className="w-2.5 h-2.5" />{memberCount} members
            </div>
          </div>
          {unread > 0 && minimized && (
            <span className="ml-1 w-5 h-5 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button onClick={e => { e.stopPropagation(); onToggleMinimize() }}
            className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
            {minimized ? <ChevronDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>
          <button onClick={e => { e.stopPropagation(); onClose() }}
            className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Event label */}
          <div className="px-4 py-1.5 bg-orange-50 border-b border-orange-100">
            <span className="text-xs text-orange-600 font-semibold truncate block">{eventTitle}</span>
          </div>

          {/* Messages */}
          <div className="overflow-y-auto p-3 space-y-3 bg-gray-50" style={{ height: '400px' }}>
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-2xl mb-2">👋</div>
                <p className="text-xs text-gray-400">No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.user_id === currentUserId
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full ${getColor(msg.user_id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1`}>
                      {getInitial(msg.sender_username || '')}
                    </div>
                    <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Username */}
                      <span className="text-xs text-gray-400 mb-0.5 px-1">
                        {isMe ? 'You' : msg.sender_username}
                      </span>
                      {/* Bubble */}
                      <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-orange-500 text-white rounded-tr-sm'
                          : 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.message}
                      </div>
                      {/* Time */}
                      <span className="text-xs text-gray-400 mt-0.5 px-1">
                        {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input or Join */}
          {isMember ? (
            <div className="flex items-center gap-2 p-3 bg-white border-t border-gray-100">
              <div className={`w-7 h-7 rounded-full ${getColor(currentUserId)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {getInitial(currentUsername)}
              </div>
              <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-full text-base md:text-xs text-gray-900 outline-none focus:border-orange-400 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center disabled:opacity-40 transition-colors flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            <div className="p-3 bg-white border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500 mb-2">Join this group to send messages</p>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60"
              >
                {joining ? 'Joining...' : 'Join Group'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function GroupChatBar() {
  const { openGroups, closeGroup, toggleMinimize } = useGroupChat()
  if (openGroups.length === 0) return null
  return (
    <div className="fixed bottom-0 right-6 z-40 flex items-end gap-3">
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