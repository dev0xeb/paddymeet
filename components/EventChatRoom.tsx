'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Users,
  Image as ImageIcon,
  Video,
  Send,
  Plus,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Maximize2,
  Play,
  Flame,
  Radio,
  Clock,
  MapPin,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { uploadChatMedia, parseChatMessage } from '@/lib/chatMedia'

export interface ChatMessage {
  id: string
  groupId: string
  userId: string
  text: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  createdAt: string
  sender: {
    username: string
    fullName: string
    tier: string
    avatarUrl?: string
  }
}

export interface SquadItem {
  id: string
  name: string
  description?: string
  eventId: string
  creatorId: string
  creatorUsername: string
  maxMembers: number
  memberCount: number
  isMember: boolean
  isFull: boolean
  status: string
  createdAt: string
}

interface Props {
  eventId: string
  eventTitle: string
  mainGroupId: string
  hasTicket: boolean
  currentUserId?: string
  currentUsername?: string
}

export default function EventChatRoom({
  eventId,
  eventTitle,
  mainGroupId,
  hasTicket,
  currentUserId,
  currentUsername,
}: Props) {
  const [activeTab, setActiveTab] = useState<'main' | 'squads'>('main')
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null)
  const [selectedSquadName, setSelectedSquadName] = useState<string>('')

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  // Media Attachment State
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [attachmentType, setAttachmentType] = useState<'image' | 'video' | null>(null)
  const [uploadProgress, setUploadProgress] = useState(false)

  // Lightbox Modal for Images/Videos
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null)

  // Squads State
  const [squads, setSquads] = useState<SquadItem[]>([])
  const [loadingSquads, setLoadingSquads] = useState(false)
  const [showCreateSquadModal, setShowCreateSquadModal] = useState(false)
  const [newSquadName, setNewSquadName] = useState('')
  const [newSquadArea, setNewSquadArea] = useState('Lekki Phase 1')
  const [newSquadMax, setNewSquadMax] = useState(5)
  const [creatingSquad, setCreatingSquad] = useState(false)
  const [joiningSquadId, setJoiningSquadId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabaseRef = useRef(createClient())

  const activeGroupId = selectedSquadId || mainGroupId

  // Auto-scroll on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 1. Fetch Messages for Active Room
  useEffect(() => {
    if (!activeGroupId) return

    let isMounted = true
    setLoadingMessages(true)

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/groups/messages?group_id=${activeGroupId}`)
        const data = await res.json()
        if (isMounted && data.messages) {
          setMessages(data.messages)
        }
      } catch (err) {
        console.error('Failed to load chat messages:', err)
      } finally {
        if (isMounted) setLoadingMessages(false)
      }
    }

    fetchMessages()

    // 2. Realtime WebSocket Subscription on group_messages
    const supabase = supabaseRef.current
    const channel = supabase
      .channel(`room_${activeGroupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${activeGroupId}`,
        },
        async (payload) => {
          const newRow = payload.new as {
            id: string
            group_id: string
            user_id: string
            message: string
            created_at: string
          }

          // Parse media
          const { text: textContent, mediaUrl, mediaType } = parseChatMessage(newRow.message)

          // Fetch sender profile if not current user
          let senderUsername = currentUsername || 'Explorer'
          if (newRow.user_id !== currentUserId) {
            const { data: u } = await supabase
              .from('users')
              .select('username')
              .eq('id', newRow.user_id)
              .single()
            if (u?.username) senderUsername = u.username
          }

          const incomingMsg: ChatMessage = {
            id: newRow.id,
            groupId: newRow.group_id,
            userId: newRow.user_id,
            text: textContent,
            mediaUrl,
            mediaType,
            createdAt: newRow.created_at,
            sender: {
              username: senderUsername,
              fullName: senderUsername,
              tier: 'Explorer',
            },
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) return prev
            return [...prev, incomingMsg]
          })
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [activeGroupId, currentUserId, currentUsername])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 3. Fetch Squads & Realtime Dynamic Counters
  const fetchSquads = async () => {
    setLoadingSquads(true)
    try {
      const res = await fetch(`/api/groups/squads?event_id=${eventId}`)
      const data = await res.json()
      if (data.squads) {
        setSquads(data.squads)
      }
    } catch (err) {
      console.error('Failed to load squads:', err)
    } finally {
      setLoadingSquads(false)
    }
  }

  useEffect(() => {
    fetchSquads()

    // Realtime listener on group_members to update dynamic counters live
    const supabase = supabaseRef.current
    const membersChannel = supabase
      .channel(`squad_members_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
        },
        () => {
          // Re-fetch squads to refresh dynamic counters instantly
          fetchSquads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(membersChannel)
    }
  }, [eventId])

  // Handle File Selection
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

  // Send Message with Optional Media
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!inputText.trim() && !attachmentFile) || sending) return

    setSending(true)
    let uploadedMediaUrl: string | undefined
    let uploadedMediaType: 'image' | 'video' | undefined

    try {
      // 1. Upload media if attached
      if (attachmentFile) {
        setUploadProgress(true)
        const uploadRes = await uploadChatMedia({
          file: attachmentFile,
          eventId,
          groupId: activeGroupId,
        })
        uploadedMediaUrl = uploadRes.url
        uploadedMediaType = uploadRes.mediaType
      }

      // 2. Post message to API
      const res = await fetch('/api/groups/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: activeGroupId,
          message: inputText.trim(),
          media_url: uploadedMediaUrl,
          media_type: uploadedMediaType,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        alert(data.error || 'Failed to send message')
      } else {
        setInputText('')
        cancelAttachment()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      alert(msg)
    } finally {
      setSending(false)
      setUploadProgress(false)
    }
  }

  // Create Squad Handler
  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSquadName.trim() || creatingSquad) return

    setCreatingSquad(true)
    try {
      const res = await fetch('/api/groups/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          name: newSquadName.trim(),
          departure_area: newSquadArea,
          max_members: newSquadMax,
          description: `Meeting area: ${newSquadArea}`,
        }),
      })

      const data = await res.json()
      if (data.success && data.squad) {
        setShowCreateSquadModal(false)
        setNewSquadName('')
        await fetchSquads()
        setSelectedSquadId(data.squad.id)
        setSelectedSquadName(data.squad.name)
        setActiveTab('main')
      } else {
        alert(data.error || 'Could not create squad.')
      }
    } catch {
      alert('Error creating squad. Please check network.')
    } finally {
      setCreatingSquad(false)
    }
  }

  // Join Squad Handler
  const handleJoinSquad = async (squadId: string, squadName: string) => {
    setJoiningSquadId(squadId)
    try {
      const res = await fetch('/api/groups/squads/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ squad_id: squadId }),
      })

      const data = await res.json()
      if (data.success) {
        await fetchSquads()
        setSelectedSquadId(squadId)
        setSelectedSquadName(squadName)
        setActiveTab('main')
      } else {
        alert(data.error || 'Could not join squad.')
      }
    } catch {
      alert('Network error while joining squad.')
    } finally {
      setJoiningSquadId(null)
    }
  }

  // Non-ticket Holder Guard Screen
  if (!hasTicket) {
    return (
      <div className="bg-[#0b1017] border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 grid place-items-center mx-auto mb-4">
          <Lock size={28} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Ticket Holders Lounge & Squads</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
          Access the live event chat, share photos/videos, coordinate rides, and form squads with other attendees.
        </p>
        <a
          href="#tickets"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700 transition-all transform hover:-translate-y-0.5"
        >
          <span>Get Pass to Unlock Chat</span>
          <ArrowRight size={14} />
        </a>
      </div>
    )
  }

  return (
    <div className="bg-[#0b1017] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px] relative">
      {/* Top Header / Navigation Tabs */}
      <div className="bg-[#0e1622] border-b border-white/10 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 grid place-items-center font-bold">
            <Radio size={16} className="animate-pulse text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white truncate max-w-[220px] sm:max-w-[340px]">
                {selectedSquadId ? `Squad: ${selectedSquadName}` : eventTitle}
              </h3>
              {selectedSquadId && (
                <button
                  onClick={() => {
                    setSelectedSquadId(null)
                    setSelectedSquadName('')
                  }}
                  className="text-[10px] font-semibold text-orange-400 hover:underline bg-orange-500/10 px-2 py-0.5 rounded"
                >
                  ← Back to Main Chat
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{selectedSquadId ? 'Private Squad Sub-Room' : 'Live Event Chat'}</span>
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'main'
                ? 'bg-orange-500 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare size={13} />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('squads')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'squads'
                ? 'bg-orange-500 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users size={13} />
            <span>Squads</span>
            <span className="ml-1 px-1.5 py-0.2 bg-black/30 rounded-full text-[10px]">
              {squads.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Tab 1: Live Chat Room */}
      {activeTab === 'main' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {loadingMessages ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-orange-400 grid place-items-center mb-3">
                  <Sparkles size={22} />
                </div>
                <h4 className="text-white font-bold text-sm mb-1">Be the first to say hi!</h4>
                <p className="text-xs text-gray-400 max-w-xs">
                  Drop a message, share photos of your fit, or coordinate meeting spots.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.userId === currentUserId
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full grid place-items-center text-[10px] font-bold flex-shrink-0 text-white shadow ${
                        isMe ? 'bg-orange-600' : 'bg-slate-700'
                      }`}
                    >
                      {msg.sender.username.substring(0, 1).toUpperCase()}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[78%] sm:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[11px] font-semibold text-gray-300">
                          {isMe ? 'You' : `@${msg.sender.username}`}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`rounded-2xl p-3 shadow-md ${
                          isMe
                            ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-tr-none'
                            : 'bg-[#151f2e] border border-white/10 text-gray-100 rounded-tl-none'
                        }`}
                      >
                        {/* Media Attachment: Image */}
                        {msg.mediaUrl && msg.mediaType === 'image' && (
                          <div
                            onClick={() => setLightboxMedia({ url: msg.mediaUrl!, type: 'image' })}
                            className="relative rounded-xl overflow-hidden mb-2 cursor-pointer group max-h-64 bg-black/40"
                          >
                            <img
                              src={msg.mediaUrl}
                              alt="Chat attachment"
                              className="w-full h-auto object-cover max-h-64 group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 size={18} className="text-white drop-shadow" />
                            </div>
                          </div>
                        )}

                        {/* Media Attachment: Video */}
                        {msg.mediaUrl && msg.mediaType === 'video' && (
                          <div className="relative rounded-xl overflow-hidden mb-2 bg-black/80 max-h-64">
                            <video
                              src={msg.mediaUrl}
                              controls
                              className="w-full h-auto max-h-64 rounded-xl"
                            />
                          </div>
                        )}

                        {/* Text Message */}
                        {msg.text && (
                          <p className="text-xs sm:text-[13px] leading-relaxed break-words whitespace-pre-wrap">
                            {msg.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview Bar */}
          {attachmentPreview && (
            <div className="bg-[#121b29] border-t border-white/10 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {attachmentType === 'image' ? (
                  <img
                    src={attachmentPreview}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-black/60 border border-white/20 grid place-items-center text-orange-400">
                    <Video size={20} />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-[200px]">
                    {attachmentFile?.name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {(attachmentFile!.size / 1024 / 1024).toFixed(2)} MB · {attachmentType}
                  </p>
                </div>
              </div>
              <button
                onClick={cancelAttachment}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 grid place-items-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Chat Input Box */}
          <form onSubmit={handleSendMessage} className="bg-[#0e1622] border-t border-white/10 p-3 sm:p-4">
            <div className="flex items-center gap-2 bg-[#151f2e] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-orange-500 transition-colors">
              {/* File Attachment Trigger */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-400 hover:text-orange-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                title="Attach photo or video"
              >
                <ImageIcon size={18} />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  selectedSquadId
                    ? `Message ${selectedSquadName}...`
                    : 'Chat with event attendees...'
                }
                className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-white placeholder-gray-500 py-1"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!inputText.trim() && !attachmentFile) || sending}
                className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 text-white grid place-items-center transition-all shadow-md flex-shrink-0"
              >
                {sending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Squad Rooms & Dynamic Counters */}
      {activeTab === 'squads' && (
        <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Squads Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Flame size={16} className="text-orange-500" />
                  <span>Open Squads for this Event</span>
                </h4>
                <p className="text-xs text-gray-400">
                  Join a squad to split rides, tables, or arrive as a crew.
                </p>
              </div>
              <button
                onClick={() => setShowCreateSquadModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow"
              >
                <Plus size={14} />
                <span>Start Squad</span>
              </button>
            </div>

            {/* Squads Grid */}
            {loadingSquads ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : squads.length === 0 ? (
              <div className="py-16 text-center">
                <Users size={32} className="text-gray-600 mx-auto mb-3" />
                <h5 className="text-white font-bold text-sm mb-1">No Squads Created Yet</h5>
                <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">
                  Be the squad leader! Create the first group for ride-sharing or VIP tables.
                </p>
                <button
                  onClick={() => setShowCreateSquadModal(true)}
                  className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold rounded-xl hover:bg-orange-500/30 transition-colors"
                >
                  Create Squad
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {squads.map((squad) => {
                  const percentFilled = Math.min(100, Math.round((squad.memberCount / squad.maxMembers) * 100))
                  return (
                    <div
                      key={squad.id}
                      className="bg-[#131d2b] border border-white/10 hover:border-orange-500/40 rounded-2xl p-4 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h5 className="text-sm font-bold text-white">{squad.name}</h5>
                          {/* Live Dynamic Counter Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              squad.isFull
                                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            <Users size={10} />
                            <span>
                              {squad.memberCount}/{squad.maxMembers} filled
                            </span>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              squad.isFull ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percentFilled}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mb-3">
                          <Clock size={11} className="text-gray-500" />
                          <span>Active squad for {eventTitle}</span>
                        </p>
                      </div>

                      {/* Action Button */}
                      {squad.isMember ? (
                        <button
                          onClick={() => {
                            setSelectedSquadId(squad.id)
                            setSelectedSquadName(squad.name)
                            setActiveTab('main')
                          }}
                          className="w-full py-2 bg-white/10 hover:bg-white/15 text-orange-400 text-xs font-bold rounded-xl border border-orange-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Open Squad Chat</span>
                          <ArrowRight size={13} />
                        </button>
                      ) : squad.isFull ? (
                        <button
                          disabled
                          className="w-full py-2 bg-gray-800 text-gray-500 text-xs font-bold rounded-xl cursor-not-allowed"
                        >
                          Squad Full
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinSquad(squad.id, squad.name)}
                          disabled={joiningSquadId === squad.id}
                          className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
                        >
                          {joiningSquadId === squad.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Join Squad</span>
                              <Plus size={13} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start Squad Modal */}
      {showCreateSquadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1724] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateSquadModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 grid place-items-center">
                <Flame size={18} />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Create a New Squad</h4>
                <p className="text-xs text-gray-400">Bring explorers together for this event</p>
              </div>
            </div>

            <form onSubmit={handleCreateSquad} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Squad Name
                </label>
                <input
                  type="text"
                  required
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  placeholder="e.g. Lekki Ride Share / VIP Table Crew"
                  className="w-full bg-[#162233] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Departure / Meeting Hub
                </label>
                <select
                  value={newSquadArea}
                  onChange={(e) => setNewSquadArea(e.target.value)}
                  className="w-full bg-[#162233] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                >
                  <option value="Lekki Phase 1">Lekki Phase 1 / Victoria Island</option>
                  <option value="Ikeja GRA">Ikeja GRA / Mainland</option>
                  <option value="Yaba Tech Hub">Yaba / Surulere</option>
                  <option value="Abuja Central">Abuja Central / Wuse</option>
                  <option value="Direct Venue Entrance">Direct at Venue Entrance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                  Max Members (Dynamic Limit)
                </label>
                <div className="flex gap-2">
                  {[4, 5, 6, 8].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setNewSquadMax(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        newSquadMax === num
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-[#162233] text-gray-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {num} spots
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingSquad || !newSquadName.trim()}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {creatingSquad ? 'Creating Squad...' : 'Launch Squad & Enter Chat'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo / Video Zoom */}
      {lightboxMedia && (
        <div
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-colors"
          >
            <X size={20} />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl">
            {lightboxMedia.type === 'image' ? (
              <img
                src={lightboxMedia.url}
                alt="Full preview"
                className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              />
            ) : (
              <video
                src={lightboxMedia.url}
                controls
                autoPlay
                className="w-auto h-auto max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
