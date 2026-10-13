export async function verifyTurnstileToken(token: string | null | undefined, ip?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  // Not configured in this environment yet — let requests through rather
  // than lock everyone out of signup/login/password-reset the moment this
  // code ships, before the secret key has actually been added here.
  if (!secret) return true

  if (!token) return false

  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await res.json()
    return data.success === true
  } catch (err) {
    console.error('Turnstile verification request failed:', err)
    return false
  }
}

export function getClientIp(request: Request): string | null {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
}
