import { createAdminClient } from '@/lib/supabase-admin'

interface RateLimitOptions {
  key: string
  limit: number
  windowSeconds: number
}

// Backed by the check_rate_limit() Postgres function (migration 027) so the
// read-and-increment is atomic at the DB level — safe under concurrent
// requests for the same key, which a read-then-write from here wouldn't be.
export async function checkRateLimit({ key, limit, windowSeconds }: RateLimitOptions): Promise<boolean> {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.rpc('check_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    // Fail open — a broken rate-limit check shouldn't take down signup,
    // login, or checkout for everyone.
    console.error('Rate limit check failed:', error)
    return true
  }

  return data as boolean
}
