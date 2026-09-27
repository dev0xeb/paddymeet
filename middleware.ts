import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Fast-path bypass for static files, public assets, and api webhooks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.webmanifest') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map|json)$/)
  ) {
    return NextResponse.next()
  }

  const isProtectedUserRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/organiser') ||
    pathname.startsWith('/tickets') ||
    pathname.startsWith('/groups') ||
    pathname.startsWith('/referrals') ||
    pathname.startsWith('/trust-score')

  const isProtectedAdminRoute =
    pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')

  // If the route is public, avoid blocking network roundtrips to Supabase Auth
  if (!isProtectedUserRoute && !isProtectedAdminRoute) {
    return NextResponse.next()
  }

  // Check for presence of Supabase auth cookie
  const allCookies = request.cookies.getAll()
  const hasAuthCookie = allCookies.some(
    c => c.name.startsWith('sb-') && (c.name.endsWith('-auth-token') || c.value.length > 20)
  )

  // If no auth cookie is present, redirect immediately without waiting on network
  if (!hasAuthCookie) {
    const url = request.nextUrl.clone()
    url.pathname = isProtectedAdminRoute ? '/admin-login' : '/login'
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // Timeout guard against Supabase Auth retry hangs — getUser() always
    // makes a real network round-trip to revalidate the session (that's
    // what makes it safe to trust in SSR, unlike getSession()), so this
    // needs real headroom for normal latency, not just protection against
    // a truly hung request.
    const TIMED_OUT = Symbol('timed_out')
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise<typeof TIMED_OUT>((resolve) => setTimeout(() => resolve(TIMED_OUT), 8000))
    const result = await Promise.race([userPromise, timeoutPromise])

    // A real session cookie is already confirmed present at this point
    // (hasAuthCookie above). If the verification call itself is just slow
    // — a cold start, a network blip, momentary Supabase Auth latency — that
    // is not the same thing as Supabase actually saying "no user", and
    // must not be treated as one. Doing so was exactly what made a
    // logged-in user get bounced to /login on an ordinary reload: the
    // 8-second budget helps, but any environment can still occasionally
    // exceed it, and every one of those moments was silently logging
    // people out of a session that was actually still valid. Only redirect
    // once Supabase has definitively resolved and confirmed there's no
    // user — on timeout, let the request through and leave auth enforcement
    // to the page itself.
    if (result === TIMED_OUT) {
      return supabaseResponse
    }

    const user = result?.data?.user

    // Redirect unauthenticated users from protected user routes
    if (!user && isProtectedUserRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Redirect unauthenticated users from admin routes
    if (!user && isProtectedAdminRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin-login'
      return NextResponse.redirect(url)
    }
  } catch {
    // The verification call itself errored (not a definitive "no user"
    // response) — same reasoning as the timeout case above: a confirmed
    // session cookie already exists, so don't treat a transient error as a
    // logout. Let the request through.
    return supabaseResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)',
  ],
}
