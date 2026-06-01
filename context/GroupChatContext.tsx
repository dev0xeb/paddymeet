'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface OpenGroup {
  id: string
  name: string
  event_title: string
  minimized: boolean
}

interface GroupChatContextType {
  openGroups: OpenGroup[]
  openGroup: (group: Omit<OpenGroup, 'minimized'>) => void
  closeGroup: (groupId: string) => void
  toggleMinimize: (groupId: string) => void
  minimizeAll: () => void
}

const GroupChatContext = createContext<GroupChatContextType>({
  openGroups: [],
  openGroup: () => {},
  closeGroup: () => {},
  toggleMinimize: () => {},
  minimizeAll: () => {},
})

export function GroupChatProvider({ children }: { children: ReactNode }) {
  const [openGroups, setOpenGroups] = useState<OpenGroup[]>([])

  const openGroup = (group: Omit<OpenGroup, 'minimized'>) => {
    setOpenGroups(prev => {
      const exists = prev.find(g => g.id === group.id)
      if (exists) {
        // If already open, just unminimize it
        return prev.map(g => g.id === group.id ? { ...g, minimized: false } : g)
      }
      // Max 3 open at once — minimize oldest if needed
      const updated = prev.length >= 3
        ? prev.map((g, i) => i === 0 ? { ...g, minimized: true } : g)
        : prev
      return [...updated, { ...group, minimized: false }]
    })
  }

  const closeGroup = (groupId: string) => {
    setOpenGroups(prev => prev.filter(g => g.id !== groupId))
  }

  const toggleMinimize = (groupId: string) => {
    setOpenGroups(prev =>
      prev.map(g => g.id === groupId ? { ...g, minimized: !g.minimized } : g)
    )
  }

  const minimizeAll = () => {
    setOpenGroups(prev => prev.map(g => ({ ...g, minimized: true })))
  }

  return (
    <GroupChatContext.Provider value={{ openGroups, openGroup, closeGroup, toggleMinimize, minimizeAll }}>
      {children}
    </GroupChatContext.Provider>
  )
}

export function useGroupChat() {
  return useContext(GroupChatContext)
}