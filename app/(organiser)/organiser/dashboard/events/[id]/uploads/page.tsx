import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import OrganiserNav from '@/components/OrganiserNav'
import { parseChatMessage } from '@/lib/chatMedia'
import { ArrowLeft, Download, Image as ImageIcon } from 'lucide-react'

interface Upload {
  id: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  caption: string
  createdAt: string
  groupName: string
  senderName: string
}

export default async function EventUploadsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: organiser } = await supabase
    .from('organisers')
    .select('id, org_name')
    .eq('id', user.id)
    .single()
  if (!organiser) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('id, title')
    .eq('id', id)
    .eq('organiser_id', user.id)
    .single()
  if (!event) notFound()

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, group_type')
    .eq('event_id', id)

  const groupMap = new Map((groups || []).map(g => [g.id, g]))
  const groupIds = Array.from(groupMap.keys())

  let uploads: Upload[] = []

  if (groupIds.length > 0) {
    const { data: messages } = await supabase
      .from('group_messages')
      .select('id, group_id, user_id, message, created_at')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(500)

    const withMedia = (messages || [])
      .map(m => {
        const { mediaUrl, mediaType, text } = parseChatMessage(m.message)
        if (!mediaUrl || !mediaType) return null
        const group = groupMap.get(m.group_id)
        return {
          id: m.id,
          userId: m.user_id,
          mediaUrl,
          mediaType,
          caption: text,
          createdAt: m.created_at,
          groupName: group?.name || (group?.group_type === 'main' ? 'Main chat' : 'Group chat'),
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)

    const senderIds = Array.from(new Set(withMedia.map(m => m.userId)))
    const { data: senders } = senderIds.length > 0
      ? await supabase.from('users').select('id, username, full_name').in('id', senderIds)
      : { data: [] }
    const senderMap = new Map((senders || []).map(s => [s.id, s]))

    uploads = withMedia.map(m => ({
      id: m.id,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      caption: m.caption,
      createdAt: m.createdAt,
      groupName: m.groupName,
      senderName: senderMap.get(m.userId)?.full_name || senderMap.get(m.userId)?.username || 'A guest',
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganiserNav orgName={organiser.org_name} />

      <div className="pt-24 md:pt-16 max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Link href={`/organiser/dashboard/events/${id}`} className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-blue-500 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to event
        </Link>

        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight mb-1">{event.title} — Group Uploads</h1>
        <p className="text-xs text-gray-500 mb-6">Photos and videos shared in this event&rsquo;s group chats.</p>

        {uploads.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No uploads yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Photos and videos shared in the group chat will show up here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {uploads.map(u => (
              <div key={u.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="aspect-square bg-gray-100 relative group">
                  {u.mediaType === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.mediaUrl} alt={u.caption || 'Upload'} className="w-full h-full object-cover" />
                  ) : (
                    <video src={u.mediaUrl} className="w-full h-full object-cover" muted />
                  )}
                  <a
                    href={u.mediaUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-bold text-gray-900 truncate">{u.senderName}</div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {u.groupName} · {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
