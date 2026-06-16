import { Resend } from 'resend'
import QRCode from 'qrcode'

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_key')

const FROM_EMAIL = 'Paddymeet <tickets@paddymeet.com>'

interface TicketInfo {
  ticketCode: string
  ticketTypeName: string
  attendeeName?: string
}

interface TicketEmailData {
  to: string
  recipientName: string
  eventTitle: string
  eventDate: string
  eventTime: string
  venueName: string
  tickets: TicketInfo[]
}

export async function sendTicketEmail(data: TicketEmailData) {
  const { to, recipientName, eventTitle, eventDate, eventTime, venueName, tickets } = data

  try {
    const ticketBlocks = await Promise.all(
      tickets.map(async (ticket) => {
        const qrDataUrl = await QRCode.toDataURL(ticket.ticketCode, {
          width: 200,
          margin: 1,
          color: { dark: '#111827', light: '#ffffff' },
        })
        return `
          <div style="background: #f9fafb; border-radius: 16px; padding: 20px; margin-bottom: 16px; text-align: center;">
            <div style="font-size: 11px; font-weight: 700; color: #f97316; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${ticket.ticketTypeName}</div>
            ${ticket.attendeeName ? `<div style="font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 10px;">${ticket.attendeeName}</div>` : ''}
            <img src="${qrDataUrl}" width="160" height="160" alt="Ticket QR Code" style="display: block; margin: 0 auto 10px; border-radius: 8px;" />
            <div style="font-size: 14px; font-weight: 800; color: #111827; font-family: monospace; letter-spacing: 1px;">${ticket.ticketCode}</div>
          </div>
        `
      })
    )

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your ${tickets.length > 1 ? 'tickets' : 'ticket'} for ${eventTitle} ${tickets.length > 1 ? 'are' : 'is'} confirmed!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; padding: 32px 0;">
          <div style="background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #f0f0f0;">

            <div style="background: linear-gradient(135deg, #f97316, #ec4899); padding: 32px 24px; text-align: center;">
              <div style="font-size: 24px; font-weight: 900; color: white; letter-spacing: -0.5px;">
                paddy<span style="color: #1f2937;">meet</span>
              </div>
            </div>

            <div style="padding: 32px 24px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 56px; height: 56px; background: #f0fdf4; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 12px;">🎉</div>
                <h1 style="font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 4px;">You're in, ${recipientName}!</h1>
                <p style="font-size: 14px; color: #6b7280; margin: 0;">${tickets.length > 1 ? `${tickets.length} tickets confirmed` : 'Your ticket has been confirmed'}</p>
              </div>

              <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 16px; padding: 16px 20px; margin-bottom: 20px;">
                <div style="font-size: 16px; font-weight: 800; color: #111827; margin-bottom: 8px;">${eventTitle}</div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">📅 ${eventDate} ${eventTime ? `· ${eventTime}` : ''}</div>
                <div style="font-size: 13px; color: #6b7280;">📍 ${venueName}</div>
              </div>

              ${ticketBlocks.join('')}

              <a href="https://paddymeet.com/tickets" style="display: block; text-align: center; background: #f97316; color: white; font-weight: 700; font-size: 14px; padding: 14px; border-radius: 12px; text-decoration: none; margin-top: 8px;">
                View in Dashboard
              </a>

              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 16px 0 0;">
                Show your QR code at the entrance for quick check-in. See you there!
              </p>
            </div>
          </div>

          <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">
            Paddymeet Inc · 14 Bode Thomas Street, Surulere, Lagos
          </p>
        </div>
      `,
    })
    return { success: true, result }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}