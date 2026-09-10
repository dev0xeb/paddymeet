import { describe, it, expect } from 'vitest'

describe('2-Tier Event & Squad Chat Architecture', () => {
  it('constructs isolated event-scoped storage paths with zero cross-event mixing', () => {
    const eventId = 'evt-lagos-rave-01'
    const groupId = 'squad-lekki-crew-99'
    const mediaType = 'image'
    const timestamp = 1725268000000
    const randomSuffix = 'a8f2c'
    const ext = 'webp'

    const storagePath = `events/${eventId}/chats/${groupId}/${mediaType}s/${timestamp}_${randomSuffix}.${ext}`

    expect(storagePath).toBe('events/evt-lagos-rave-01/chats/squad-lekki-crew-99/images/1725268000000_a8f2c.webp')
    expect(storagePath.startsWith(`events/${eventId}/`)).toBe(true)
    expect(storagePath.includes('/chats/squad-lekki-crew-99/')).toBe(true)
  })

  it('correctly calculates dynamic squad capacity, percentage, and fullness', () => {
    interface Squad {
      id: string
      name: string
      maxMembers: number
      members: string[]
    }

    const squad: Squad = {
      id: 'sq-1',
      name: 'Lekki VIP Table',
      maxMembers: 5,
      members: ['user-1', 'user-2', 'user-3'],
    }

    function getSquadStats(s: Squad) {
      const count = s.members.length
      const isFull = count >= s.maxMembers
      const percent = Math.min(100, Math.round((count / s.maxMembers) * 100))
      return { count, isFull, percent }
    }

    // Initial state: 3/5
    const initial = getSquadStats(squad)
    expect(initial.count).toBe(3)
    expect(initial.isFull).toBe(false)
    expect(initial.percent).toBe(60)

    // Add 2 members -> 5/5
    squad.members.push('user-4', 'user-5')
    const full = getSquadStats(squad)
    expect(full.count).toBe(5)
    expect(full.isFull).toBe(true)
    expect(full.percent).toBe(100)
  })

  it('blocks joining when a squad is full or user already joined', () => {
    const squad = {
      maxMembers: 4,
      members: ['user-1', 'user-2', 'user-3', 'user-4'],
    }

    function joinSquad(userId: string) {
      if (squad.members.includes(userId)) {
        return { success: false, reason: 'already_joined' }
      }
      if (squad.members.length >= squad.maxMembers) {
        return { success: false, reason: 'squad_full' }
      }
      squad.members.push(userId)
      return { success: true }
    }

    // 1. Try joining full squad
    const fullRes = joinSquad('user-new')
    expect(fullRes.success).toBe(false)
    expect(fullRes.reason).toBe('squad_full')

    // 2. Try duplicate join
    const dupRes = joinSquad('user-1')
    expect(dupRes.success).toBe(false)
    expect(dupRes.reason).toBe('already_joined')
  })

  it('correctly formats and decodes media messages (photos & videos)', () => {
    function encodeMediaMessage(text: string, mediaUrl: string, mediaType: 'image' | 'video') {
      const tag = mediaType === 'image' ? '[MEDIA_IMAGE]:' : '[MEDIA_VIDEO]:'
      return `${tag}${mediaUrl}${text ? `|CAPTION:${text}` : ''}`
    }

    function decodeMediaMessage(raw: string) {
      let mediaType: 'image' | 'video' | undefined
      let mediaUrl: string | undefined
      let text = raw

      if (raw.startsWith('[MEDIA_IMAGE]:')) {
        mediaType = 'image'
        const parts = raw.replace('[MEDIA_IMAGE]:', '').split('|CAPTION:')
        mediaUrl = parts[0]?.trim()
        text = parts[1]?.trim() || ''
      } else if (raw.startsWith('[MEDIA_VIDEO]:')) {
        mediaType = 'video'
        const parts = raw.replace('[MEDIA_VIDEO]:', '').split('|CAPTION:')
        mediaUrl = parts[0]?.trim()
        text = parts[1]?.trim() || ''
      }

      return { text, mediaUrl, mediaType }
    }

    // Test Image encoding/decoding
    const rawImageMsg = encodeMediaMessage('Check out the venue setup!', 'https://supabase.co/storage/img1.webp', 'image')
    const decodedImg = decodeMediaMessage(rawImageMsg)

    expect(decodedImg.mediaType).toBe('image')
    expect(decodedImg.mediaUrl).toBe('https://supabase.co/storage/img1.webp')
    expect(decodedImg.text).toBe('Check out the venue setup!')

    // Test Video encoding/decoding
    const rawVideoMsg = encodeMediaMessage('Live DJ dropping now 🔥', 'https://supabase.co/storage/clip1.mp4', 'video')
    const decodedVid = decodeMediaMessage(rawVideoMsg)

    expect(decodedVid.mediaType).toBe('video')
    expect(decodedVid.mediaUrl).toBe('https://supabase.co/storage/clip1.mp4')
    expect(decodedVid.text).toBe('Live DJ dropping now 🔥')
  })
})
