import { NextResponse } from 'next/server'
import { sendTicketEmail } from '@/lib/email'

export async function GET() {
  console.log('Test email route called')
  
  const result = await sendTicketEmail({
    to: 'oyemadepete@gmail.com',
    recipientName: 'Peter',
    eventTitle: 'Test Event',
    eventDate: 'Sat 1 Aug',
    eventTime: '20:00',
    venueName: 'Test Venue, Lagos',
    tickets: [
      {
        ticketCode: 'PM-TEST-12345',
        ticketTypeName: 'Regular',
      }
    ],
  })

  console.log('Email result:', JSON.stringify(result))
  return NextResponse.json(result)
}