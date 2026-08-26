import { createAdminClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, 'ok' | 'error' | 'warning'> = {}

  // 1. Check environment variables
  checks.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'error'
  checks.supabase_anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ok' : 'error'
  checks.supabase_service_role = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'ok' : 'error'
  checks.paystack_public = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ? 'ok' : 'error'
  checks.paystack_secret = process.env.PAYSTACK_SECRET_KEY ? 'ok' : 'error'
  checks.resend_api = process.env.RESEND_API_KEY ? 'ok' : 'warning'

  let dbStatus: 'connected' | 'error' = 'connected'
  let dbLatency = 0

  // 2. Ping Supabase database
  try {
    const adminClient = createAdminClient()
    const dbStart = Date.now()
    const { error } = await adminClient
      .from('platform_settings')
      .select('id')
      .limit(1)

    dbLatency = Date.now() - dbStart
    if (error) {
      dbStatus = 'error'
    }
  } catch {
    dbStatus = 'error'
  }

  const totalLatency = Date.now() - startTime
  const isHealthy = dbStatus === 'connected' && checks.supabase_url === 'ok' && checks.paystack_secret === 'ok'

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      latency_ms: totalLatency,
      database: {
        status: dbStatus,
        latency_ms: dbLatency,
      },
      services: {
        paystack: checks.paystack_secret === 'ok' ? 'configured' : 'missing_credentials',
        email: checks.resend_api === 'ok' ? 'configured' : 'missing_credentials',
      },
      version: '1.0.0',
    },
    { status: isHealthy ? 200 : 503 }
  )
}
