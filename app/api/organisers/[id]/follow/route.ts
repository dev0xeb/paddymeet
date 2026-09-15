import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organiserId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminClient = createAdminClient()

    // 1. Get follower count
    const { count: followerCount } = await adminClient
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('organiser_id', organiserId)

    // 2. Check if current user is following. Array check, not .maybeSingle()
    // — .maybeSingle() errors (read as "not following") the moment more
    // than one row ever matches, instead of just returning the first one.
    let isFollowing = false
    if (user) {
      const { data: followRecords } = await adminClient
        .from('follows')
        .select('id')
        .eq('organiser_id', organiserId)
        .eq('user_id', user.id)
        .limit(1)

      isFollowing = (followRecords?.length ?? 0) > 0
    }

    return NextResponse.json({
      following: isFollowing,
      follower_count: followerCount || 0,
    })
  } catch (error) {
    console.error('Fetch follow status error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organiserId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please log in to follow organisers.' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Check if already following. Array check, not .maybeSingle() — see
    // the matching comment in the GET handler above.
    const { data: existingFollows } = await adminClient
      .from('follows')
      .select('id')
      .eq('organiser_id', organiserId)
      .eq('user_id', user.id)
      .limit(1)
    const existingFollow = existingFollows?.[0]

    if (existingFollow) {
      // Unfollow
      const { error: deleteError } = await adminClient.from('follows').delete().eq('id', existingFollow.id)
      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 })
      }

      const { count: followerCount } = await adminClient
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('organiser_id', organiserId)

      return NextResponse.json({
        following: false,
        follower_count: followerCount || 0,
        message: 'Unfollowed organiser',
      })
    } else {
      // Follow
      const { error: insertError } = await adminClient.from('follows').insert({
        user_id: user.id,
        organiser_id: organiserId,
      })
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 })
      }

      const { count: followerCount } = await adminClient
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('organiser_id', organiserId)

      // Notify organiser
      const { data: userProfile } = await adminClient
        .from('users')
        .select('full_name, username')
        .eq('id', user.id)
        .single()

      const followerName = userProfile?.full_name || userProfile?.username || 'An attendee'

      await adminClient.from('notifications').insert({
        user_id: organiserId,
        title: 'New Follower! 🎉',
        message: `${followerName} started following your events.`,
        type: 'follow',
        is_read: false,
      })

      return NextResponse.json({
        following: true,
        follower_count: followerCount || 0,
        message: 'Now following organiser',
      })
    }
  } catch (error) {
    console.error('Toggle follow error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
