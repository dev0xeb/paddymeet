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
    // 2-second timeout guard against Supabase Auth retry hangs
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
    const result: any = await Promise.race([userPromise, timeoutPromise])

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
    // On auth error, redirect safely
    if (isProtectedAdminRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin-login'
      return NextResponse.redirect(url)
    }
    if (isProtectedUserRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
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
