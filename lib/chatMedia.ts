import { createClient } from '@/lib/supabase'

export interface UploadMediaResult {
  url: string
  mediaType: 'image' | 'video'
  fileSize: number
  fileName: string
}

export interface UploadMediaParams {
  file: File
  eventId: string
  groupId: string
}

export interface ParsedChatMessage {
  text: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
}

/**
 * group_messages.message has no dedicated media columns — an attachment is
 * embedded as a `[MEDIA_IMAGE]:<url>|CAPTION:<text>` (or `_VIDEO_`) prefix.
 * Shared here so every chat surface reading this table parses it the same way.
 */
export function parseChatMessage(raw: string): ParsedChatMessage {
  const message = raw || ''

  if (message.startsWith('[MEDIA_IMAGE]:')) {
    const parts = message.replace('[MEDIA_IMAGE]:', '').split('|CAPTION:')
    return { mediaUrl: parts[0]?.trim(), mediaType: 'image', text: parts[1]?.trim() || '' }
  }
  if (message.startsWith('[MEDIA_VIDEO]:')) {
    const parts = message.replace('[MEDIA_VIDEO]:', '').split('|CAPTION:')
    return { mediaUrl: parts[0]?.trim(), mediaType: 'video', text: parts[1]?.trim() || '' }
  }
  return { text: message }
}

/** Inverse of parseChatMessage — encodes text + optional media into one string for storage. */
export function encodeChatMessage(text: string, mediaUrl?: string, mediaType?: 'image' | 'video'): string {
  if (mediaUrl && mediaType === 'image') return `[MEDIA_IMAGE]:${mediaUrl}${text ? `|CAPTION:${text}` : ''}`
  if (mediaUrl && mediaType === 'video') return `[MEDIA_VIDEO]:${mediaUrl}${text ? `|CAPTION:${text}` : ''}`
  return text
}

/**
 * Validate and compress images client-side before uploading.
 */
async function compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<Blob> {
  return new Promise((resolve) => {
    // If not an image or SVG/GIF, return original
    if (!file.type.startsWith('image/') || file.type.includes('gif') || file.type.includes('svg')) {
      resolve(file)
      return
    }

    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          resolve(blob || file)
        },
        'image/webp',
        quality
      )
    }
    img.onerror = () => resolve(file)
  })
}

/**
 * Upload chat media with strict event-level folder isolation:
 * Path: events/{eventId}/chats/{groupId}/{mediaType}s/{timestamp}_{random}_{filename}
 */
export async function uploadChatMedia({
  file,
  eventId,
  groupId,
}: UploadMediaParams): Promise<UploadMediaResult> {
  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')

  if (!isImage && !isVideo) {
    throw new Error('Only image and video files are supported in chat.')
  }

  // Size limit: 15MB for images, 50MB for video
  const maxBytes = isVideo ? 50 * 1024 * 1024 : 15 * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error(`File is too large. Max size is ${isVideo ? '50MB for video' : '15MB for photos'}.`)
  }

  const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image'
  const uploadBlob = isImage ? await compressImage(file) : file

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 7)
  const ext = isImage ? 'webp' : (cleanName.split('.').pop() || 'mp4')
  
  // Strict Event-Scoped Folder Path: events/{eventId}/chats/{groupId}/{type}s/{timestamp}_{random}.{ext}
  const storagePath = `events/${eventId}/chats/${groupId}/${mediaType}s/${timestamp}_${randomSuffix}.${ext}`

  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('chat-media')
    .upload(storagePath, uploadBlob, {
      cacheControl: '31536000',
      upsert: false,
      contentType: isImage ? 'image/webp' : file.type,
    })

  if (error) {
    // If bucket doesn't exist, provide clear error
    if (error.message.includes('Bucket not found') || error.message.includes('bucket')) {
      throw new Error('Storage bucket "chat-media" not found. Please create a public bucket named "chat-media" in Supabase Storage.')
    }
    throw new Error(`Media upload failed: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('chat-media')
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    mediaType,
    fileSize: file.size,
    fileName: file.name,
  }
}
