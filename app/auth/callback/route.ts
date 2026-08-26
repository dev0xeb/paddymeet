import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const accountType = requestUrl.searchParams.get('account_type') || 'explorer'
  const next = requestUrl.searchParams.get('next') || (accountType === 'organiser' ? '/organiser/dashboard' : '/dashboard')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user) {
      const user = session.user
      const adminClient = createAdminClient()

      // Ensure explorer profile exists in users table
      if (accountType === 'explorer') {
        const { data: existingUser } = await adminClient
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!existingUser) {
          const rawName = user.user_metadata?.full_name || user.user_metadata?.name || ''
          const baseUsername = rawName ? rawName.replace(/\s+/g, '_').toLowerCase() : (user.email?.split('@')[0] || 'user')
          const uniqueUsername = `${baseUsername.replace(/[^a-z0-9_]/g, '')}_${Math.random().toString(36).substring(2, 6)}`

          await adminClient.from('users').insert({
            id: user.id,
            email: user.email!,
            full_name: rawName || null,
            username: uniqueUsername,
            trust_score: 50,
            tier: 'Newbie',
          })
        }
      }

      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_failed`)
}
