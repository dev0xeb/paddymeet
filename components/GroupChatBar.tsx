'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Minus, Send, Users, ChevronDown, Image as ImageIcon, Video, Maximize2 } from 'lucide-react'
import { useGroupChat } from '@/context/GroupChatContext'
import { createClient } from '@/lib/supabase'
import { uploadChatMedia, parseChatMessage, encodeChatMessage } from '@/lib/chatMedia'

interface Message {
  id: string
  text: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
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
  const [eventId, setEventId] = useState('')

  // Media attachment state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [attachmentType, setAttachmentType] = useState<'image' | 'video' | null>(null)
  const [uploading, setUploading] = useState(false)
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

      // Group's parent event (needed to scope the media upload storage path)
      const { data: group } = await supabase
        .from('groups')
        .select('event_id')
        .eq('id', groupId)
        .single()
      if (group?.event_id) setEventId(group.event_id)

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

        setMessages(msgs.map(m => {
          const parsed = parseChatMessage(m.message)
          return {
            id: m.id,
            text: parsed.text,
            mediaUrl: parsed.mediaUrl,
            mediaType: parsed.mediaType,
            user_id: m.user_id,
            created_at: m.created_at,
            sender_username: usernameMap[m.user_id] || 'Unknown',
          }
        }))
      }

      // Member count
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
      setMemberCount(count || 0)

      // Check membership. Uses a plain array select (not .single()/.maybeSingle())
      // because those error out — and silently read as "not a member" — if more
      // than one membership row ever exists for this group+user pair.
      if (user) {
        const { data: membership } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('user_id', user.id)
          .limit(1)
        setIsMember((membership?.length ?? 0) > 0)
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
        const newRow = payload.new as { id: string; message: string; user_id: string; created_at: string }
        const parsed = parseChatMessage(newRow.message)
        const newMsg: Message = {
          id: newRow.id,
          text: parsed.text,
          mediaUrl: parsed.mediaUrl,
          mediaType: parsed.mediaType,
          user_id: newRow.user_id,
          created_at: newRow.created_at,
          sender_username: 'Loading...',
        }
        // Don't add if already in state (we add own messages immediately on send)
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        // Fetch username
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', newRow.user_id)
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

    // Guard against double-inserting a membership row — this is what
    // previously duplicated "joins" (and broke re-checking membership on
    // every close/reopen) when the button was clickable more than once.
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .limit(1)

    if ((existing?.length ?? 0) === 0) {
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
      })
      if (!error) setMemberCount(prev => prev + 1)
    }

    setIsMember(true)
    setJoining(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')

    if (!isImage && !isVideo) {
      alert('Please upload an image (JPG, PNG, WebP) or video (MP4, MOV).')
      return
    }

    setAttachmentFile(file)
    setAttachmentType(isVideo ? 'video' : 'image')
    setAttachmentPreview(URL.createObjectURL(file))
  }

  const cancelAttachment = () => {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview)
    setAttachmentFile(null)
    setAttachmentPreview(null)
    setAttachmentType(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = async () => {
    if ((!input.trim() && !attachmentFile) || sending) return
    setSending(true)
    const supabase = supabaseRef.current
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSending(false); return }

    let mediaUrl: string | undefined
    let mediaType: 'image' | 'video' | undefined

    if (attachmentFile) {
      setUploading(true)
      try {
        const uploaded = await uploadChatMedia({ file: attachmentFile, eventId, groupId })
        mediaUrl = uploaded.url
        mediaType = uploaded.mediaType
      } catch (err) {
        setUploading(false)
        setSending(false)
        alert(err instanceof Error ? err.message : 'Upload failed. Please try again.')
        return
      }
      setUploading(false)
    }

    const messageText = input.trim()
    const finalMessage = encodeChatMessage(messageText, mediaUrl, mediaType)
    const tempId = `temp-${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      text: messageText,
      mediaUrl,
      mediaType,
      user_id: user.id,
      created_at: new Date().toISOString(),
      sender_username: currentUsername || 'You',
    }

    // Add to state immediately
    setMessages(prev => [...prev, tempMessage])
    setInput('')
    cancelAttachment()

    const { data, error } = await supabase
      .from('group_messages')
      .insert({ group_id: groupId, user_id: user.id, message: finalMessage })
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
    <div className="flex flex-col bg-white border border-gray-200 rounded-t-2xl shadow-2xl overflow-hidden w-[calc(100vw-1.5rem)] max-w-[360px] sm:w-[360px]">

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
            className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
            {minimized ? <ChevronDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </button>
          <button onClick={e => { e.stopPropagation(); onClose() }}
            className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
            <X className="w-4 h-4" />
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
          <div className="overflow-y-auto p-3 space-y-3 bg-gray-50 h-[min(400px,55vh)]">
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
                      <div className={`rounded-2xl text-xs leading-relaxed overflow-hidden ${msg.mediaUrl ? 'p-1' : 'px-3 py-2'} ${
                        isMe
                          ? 'bg-orange-500 text-white rounded-tr-sm'
                          : 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.mediaUrl && msg.mediaType === 'image' && (
                          <div
                            onClick={() => setLightboxMedia({ url: msg.mediaUrl!, type: 'image' })}
                            className="relative rounded-xl overflow-hidden cursor-pointer group max-h-48 bg-black/10"
                          >
                            <img src={msg.mediaUrl} alt="Chat attachment" className="w-full h-auto object-cover max-h-48 group-hover:opacity-90 transition-opacity" />
                            <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
                              <Maximize2 className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                        {msg.mediaUrl && msg.mediaType === 'video' && (
                          <video src={msg.mediaUrl} controls className="w-full h-auto max-h-48 rounded-xl bg-black" />
                        )}
                        {msg.text && (
                          <p className={msg.mediaUrl ? 'px-2 py-1.5' : ''}>{msg.text}</p>
                        )}
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
            <div className="bg-white border-t border-gray-100">
              {/* Attachment preview */}
              {attachmentPreview && (
                <div className="px-3 pt-2.5 flex items-center gap-2">
                  <div className="relative flex-shrink-0">
                    {attachmentType === 'image' ? (
                      <img src={attachmentPreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-900 border border-gray-200 flex items-center justify-center">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-700 truncate">{attachmentFile?.name}</p>
                    <p className="text-xs text-gray-400">{attachmentFile ? (attachmentFile.size / 1024 / 1024).toFixed(2) : '0'} MB</p>
                  </div>
                  <button onClick={cancelAttachment} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 p-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors flex-shrink-0"
                  title="Attach photo or video"
                  type="button"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <div className={`w-7 h-7 rounded-full ${getColor(currentUserId)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {getInitial(currentUsername)}
                </div>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-full text-base md:text-xs text-gray-900 outline-none focus:border-orange-400 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachmentFile) || sending}
                  className="w-9 h-9 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center disabled:opacity-40 transition-colors flex-shrink-0"
                >
                  {uploading || sending ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-white border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500 mb-2">Join this group to send messages</p>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-2.5 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60"
              >
                {joining ? 'Joining...' : 'Join Group'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox for full-size image/video */}
      {lightboxMedia && (
        <div
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-[700] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-[92vw] max-h-[85vh] overflow-hidden rounded-2xl">
            {lightboxMedia.type === 'image' ? (
              <img src={lightboxMedia.url} alt="Full preview" className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            ) : (
              <video src={lightboxMedia.url} controls autoPlay className="w-auto h-auto max-w-full max-h-[85vh] rounded-2xl shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function GroupChatBar() {
  const { openGroups, closeGroup, toggleMinimize } = useGroupChat()
  if (openGroups.length === 0) return null
  return (
    <div className="fixed bottom-0 right-3 sm:right-6 z-40 flex items-end flex-wrap justify-end gap-3 max-w-[100vw]">
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
