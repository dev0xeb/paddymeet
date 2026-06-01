'use client'

import { useGroupChat } from '@/context/GroupChatContext'
import { MessageCircle } from 'lucide-react'

interface Props {
  groupId: string
  groupName: string
  eventTitle: string
}

export default function OpenGroupButton({ groupId, groupName, eventTitle }: Props) {
  const { openGroup } = useGroupChat()

  return (
    <button
      onClick={() => openGroup({ id: groupId, name: groupName, event_title: eventTitle })}
      className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
    >
      <MessageCircle className="w-4 h-4" />
      Open Group Chat
    </button>
  )
}