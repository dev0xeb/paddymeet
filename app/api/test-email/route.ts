import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.RESEND_API_KEY || 'NOT SET'
  
  return NextResponse.json({
    key_length: key.length,
    key_prefix: key.substring(0, 8),
    key_set: key !== 'NOT SET',
  })
}